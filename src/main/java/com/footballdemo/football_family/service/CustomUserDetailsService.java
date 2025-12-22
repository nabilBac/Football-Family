package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Recherche sécurisée par:
     * 1. username
     * 2. email
     */
    @Override
    public UserDetails loadUserByUsername(String login) throws UsernameNotFoundException {

        User user = userRepository.findByUsername(login)
                .or(() -> userRepository.findByEmail(login))
                .orElseThrow(() -> {
                    log.warn("❌ Tentative de connexion avec identifiant inconnu: {}", login);
                    return new UsernameNotFoundException("Aucun utilisateur trouvé pour: " + login);
                });

        log.info("🔐 Authentification de: {} (roles={})", user.getUsername(), user.getRoles());

        // Si ton système veut empêcher login tant que non vérifié
       /* if (!user.isVerified()) {
            log.warn("❌ Utilisateur non vérifié : {}", user.getUsername());
            throw new UsernameNotFoundException("Votre compte n'a pas encore été vérifié.");
        }*/

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())  // ⚠ identifiant unique côté JWT
                .password(user.getPassword())
                .authorities(getAuthorities(user))
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(false)
                .build();
    }

    /**
     * 🔒 Convertit un Set<UserRole> en authorities Spring Security
     */
    private Collection<? extends GrantedAuthority> getAuthorities(User user) {
        return user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                .collect(Collectors.toSet());
    }
}
