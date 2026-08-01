package com.retail.ai.controller;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/kiosk")
@CrossOrigin(origins = "*")
public class KioskController {

    private final ChatModel chatModel;
    private final WebClient asrWebClient;

    public KioskController(ChatModel chatModel, @Value("${phowhisper.asr-url}") String asrUrl) {
        this.chatModel = chatModel;
        this.asrWebClient = WebClient.create(asrUrl);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "healthy", "service", "Voice Kiosk Spring Boot 4.1"));
    }

    @PostMapping("/process-intent")
    public ResponseEntity<Map<String, Object>> processIntent(@RequestBody Map<String, String> payload) {
        String userText = payload.getOrDefault("text", "Sữa Meiji 800g ở đâu?");
        
        var systemMessage = new SystemMessage("""
            Bạn là Trợ lý Kiosk Siêu thị. Hãy trích xuất Ý định (Intent) và Mã sản phẩm (SKU) dưới dạng JSON format:
            {"intent": "FIND_PRODUCT" | "CHECK_STOCK" | "PROMOTION", "sku_keyword": "tên sản phẩm"}
            """);
        var userMessage = new UserMessage(userText);
        
        var response = chatModel.call(new Prompt(List.of(systemMessage, userMessage)));
        String jsonResult = response.getResult().getOutput().getContent();

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "input_text", userText,
            "ai_response", jsonResult
        ));
    }
}
