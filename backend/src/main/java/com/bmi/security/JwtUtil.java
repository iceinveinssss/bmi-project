package com.bmi.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    @Value("${jwt.secret}") private String secret;
    @Value("${jwt.expiration}") private long expiration;
    private Key key() { return Keys.hmacShaKeyFor(secret.getBytes()); }
    public String generateToken(String email, Long userId, String role) {
        return Jwts.builder().setSubject(email)
            .claim("userId", userId).claim("role", role)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(key()).compact();
    }
    public String extractEmail(String token) { return claims(token).getSubject(); }
    public Long extractUserId(String token) { return claims(token).get("userId", Long.class); }
    public String extractRole(String token) { return claims(token).get("role", String.class); }
    public boolean isValid(String token) { try { claims(token); return true; } catch (Exception e) { return false; } }
    private Claims claims(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody();
    }
}
