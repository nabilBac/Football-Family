package com.footballdemo.football_family.controller.api;



import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class MeController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<User> me(Principal principal) {

        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        User user = userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        return new ApiResponse<>(true, "OK", user);
    }
}

