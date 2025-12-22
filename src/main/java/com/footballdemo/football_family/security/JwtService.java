package com.footballdemo.football_family.security;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.footballdemo.football_family.model.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    @Value("${jwt.refreshExpiration}")
    private long refreshExpirationMs;

    private Key getSigningKey() {
        return new SecretKeySpec(secretKey.getBytes(), SignatureAlgorithm.HS256.getJcaName());
    }

    // ============================================================
    // ACCESS TOKEN — avec infos user
    // ============================================================
 public String generateAccessToken(User user) {

    Map<String, Object> claims = new HashMap<>();

    claims.put("userId", user.getId());
    claims.put("email", user.getEmail());  
    claims.put("roles", user.getRoles().stream()
            .map(Enum::name)
            .collect(Collectors.toList()));
    claims.put("verified", user.getVerified());
    claims.put("type", user.getHighestRole());

    // ✅ DEBUG: Vérifie la valeur
   Long clubId = user.getPrimaryClubId();
if (clubId != null) {
    claims.put("clubId", clubId);
}

    return buildToken(claims, user.getUsername(), jwtExpirationMs);
}

    // Version pour UserDetails (si besoin)
    public String generateAccessToken(UserDetails userDetails) {
        return buildToken(new HashMap<>(), userDetails.getUsername(), jwtExpirationMs);
    }

    // ============================================================
    // REFRESH TOKEN — simple & long
    // ============================================================
    public String generateRefreshToken(User user) {
        return buildToken(new HashMap<>(), user.getUsername(), refreshExpirationMs);
    }

    // ============================================================
    // TOKEN BUILDER
    // ============================================================
    private String buildToken(Map<String, Object> claims, String subject, long expiration) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ============================================================
    // EXTRACTION INFOS
    // ============================================================
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        return extractAllClaims(token).get("userId", Long.class);
    }

    public boolean extractVerified(String token) {
        return extractAllClaims(token).get("verified", Boolean.class);
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // ============================================================
    // VALIDATION
    // ============================================================
    public boolean isTokenValid(String token, UserDetails userDetails) {
        return extractUsername(token).equals(userDetails.getUsername()) &&
                !isTokenExpired(token);
    }

    public boolean isRefreshTokenValid(String token) {
        return !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }
}
