package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository){
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username);
        if(user == null){
            throw new UsernameNotFoundException("Utilisateur introuvable");
        }

        // Spring Security User
        return org.springframework.security.core.userdetails.User.withUsername(user.getUsername())
                .password(user.getPassword())   // mot de passe déjà encodé
                .roles("USER")                 // rôle par défaut
                .build();
    }
}
