package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.service.VideoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;



@Controller
public class HomeController {

    @Autowired
    private VideoService videoService;

   @GetMapping("/")
public String home(Model model) {
    List<Video> videos;
    try {
        videos = videoService.getAllVideosOrderByDate();
        if (videos == null) videos = List.of(); // jamais null
    } catch (Exception e) {
        videos = List.of();
        e.printStackTrace(); // permet de voir l’erreur exacte dans la console
    }

    model.addAttribute("videos", videos);
    return "index";
}

}
