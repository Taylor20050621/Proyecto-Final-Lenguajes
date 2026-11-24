package com.playtesting.platform.controller;

import com.playtesting.platform.dto.UserProfileDto;
import com.playtesting.platform.dto.UserNotificationDto;
import java.util.List;
import com.playtesting.platform.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserProfileDto me(Authentication authentication) {
        return userService.getProfile(authentication.getName());
    }

    @GetMapping("/me/notifications")
    public List<UserNotificationDto> notifications(Authentication authentication) {
        return userService.getNotifications(authentication.getName());
    }
}
