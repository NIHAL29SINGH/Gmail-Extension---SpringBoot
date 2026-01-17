package com.email.writer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class EmailGeneratorService {

    private final WebClient webClient;
    private final String apiKey;

    public EmailGeneratorService(
            WebClient.Builder builder,
            @Value("${gemini.api.url}") String baseUrl,
            @Value("${gemini.api.key}") String apiKey
    ) {
        this.webClient = builder.baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    public Mono<String> generateEmailReply(EmailRequest request) {

        String prompt = buildPrompt(request);

        String body = """
            {
              "contents": [
                {
                  "parts": [
                    { "text": "%s" }
                  ]
                }
              ]
            }
            """.formatted(escapeJson(prompt));

        return webClient.post()
                .uri("/v1beta/models/gemini-2.5-flash:generateContent")
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .map(this::extractText);
    }

    // -----------------------------
    // RESPONSE PARSER
    // -----------------------------
    private String extractText(String response) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);

            return root.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini response", e);
        }
    }

    // -----------------------------
    // PROMPT BUILDER (IMPORTANT)
    // -----------------------------
    private String buildPrompt(EmailRequest req) {

        StringBuilder prompt = new StringBuilder();

        prompt.append("""
            You are a professional email writing assistant.
            Generate a clear and well-written email reply.
            """);

        // Language
        if ("hindi".equalsIgnoreCase(req.getLanguage())) {
            prompt.append("""
                Write the reply in PURE Hindi language.
                Use Devanagari script only.
                Do NOT use English words.
                """);
        } else {
            prompt.append("""
                Write the reply in professional English.
                """);
        }

        // Tone
        if (req.getTone() != null) {
            prompt.append("Tone: ").append(req.getTone()).append(".\n");
        }

        // Length
        if (req.getLength() != null) {
            prompt.append("Length: ").append(mapLength(req.getLength())).append(".\n");
        }

        // Custom instruction
        if (req.getCustomPrompt() != null && !req.getCustomPrompt().isBlank()) {
            prompt.append("Instruction: ")
                    .append(req.getCustomPrompt())
                    .append("\n");
        }

        prompt.append("\nOriginal Email:\n");
        prompt.append(req.getEmailContent());

        prompt.append("\n\nWrite only the reply. No explanations.");

        return prompt.toString();
    }

    private String mapLength(String length) {
        return switch (length.toLowerCase()) {
            case "short" -> "2–3 short sentences";
            case "long" -> "detailed and well explained";
            default -> "medium length";
        };
    }

    private String escapeJson(String text) {
        return text.replace("\"", "\\\"");
    }
}
