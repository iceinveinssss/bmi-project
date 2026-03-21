package com.bmi.control;

import com.bmi.entity.User;
import com.bmi.foundation.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void register_login_profile_and_bmi_crud_flow() throws Exception {
        // register
        String registerBody = """
            {"name":"Test User","email":"test@example.com","password":"secret123","birthYear":2000}
            """;

        String registerJson = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andReturn().getResponse().getContentAsString();

        JsonNode registerNode = objectMapper.readTree(registerJson);
        String token = registerNode.get("token").asText();
        assertThat(token).isNotBlank();

        // profile
        mockMvc.perform(get("/api/users/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("test@example.com"));

        // calculate
        String calcBody = """
            {"weight":70.0,"height":175.0}
            """;
        String calcJson = mockMvc.perform(post("/api/bmi/calculate")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(calcBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andExpect(jsonPath("$.bmi").isNotEmpty())
            .andReturn().getResponse().getContentAsString();

        long recordId = objectMapper.readTree(calcJson).get("id").asLong();

        // get by id (owner-protected)
        mockMvc.perform(get("/api/bmi/{id}", recordId)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(recordId));

        // update
        String updateBody = """
            {"weight":72.0,"height":175.0}
            """;
        mockMvc.perform(put("/api/bmi/{id}", recordId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.weight").value(72.0));

        // history + search
        mockMvc.perform(get("/api/bmi/history")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/bmi/search").param("category", "Норма")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());

        // delete
        mockMvc.perform(delete("/api/bmi/{id}", recordId)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());
    }

    @Test
    void admin_endpoints_require_admin_role() throws Exception {
        // create admin in H2
        User admin = User.builder()
            .name("Admin")
            .email("admin@bmi.ru")
            .password(passwordEncoder.encode("admin123"))
            .role(User.Role.ADMIN)
            .build();
        userRepository.save(admin);

        // login as admin
        String loginBody = """
            {"email":"admin@bmi.ru","password":"admin123"}
            """;
        String loginJson = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andReturn().getResponse().getContentAsString();

        String adminToken = objectMapper.readTree(loginJson).get("token").asText();

        // admin ok
        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());

        // user forbidden
        String regBody = """
            {"name":"User","email":"user2@example.com","password":"secret123","birthYear":2001}
            """;
        String regJson = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(regBody))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        String userToken = objectMapper.readTree(regJson).get("token").asText();

        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isForbidden());
    }
}

