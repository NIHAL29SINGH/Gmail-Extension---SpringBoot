package com.email.writer;

import lombok.Data;

@Data
public class EmailRequest {

    private String emailContent;

    // Tone: professional | friendly | casual
    private String tone;

    // Language: english | hindi
    private String language;

    // Optional instruction from user
    private String customPrompt;

    // short | medium | long
    private String length;
}
