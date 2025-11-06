package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 🔍 Cherche par username d'abord, sinon par email
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(username);
        }

        User user = userOpt.orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable: " + username));

        // 🎭 Retourne un UserDetails avec les rôles dynamiques
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .authorities(getAuthorities(user))
                .build();
    }

    /**
     * 🎭 Convertit les rôles User en GrantedAuthority pour Spring Security
     * Exemple: UserRole.COACH devient "ROLE_COACH"
     */
    private Collection<? extends GrantedAuthority> getAuthorities(User user) {

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            // Si pas de rôles, donne USER par défaut
            return java.util.List.of(new SimpleGrantedAuthority("ROLE_USER"));
        }

        return user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                .collect(Collectors.toList());
    }
}