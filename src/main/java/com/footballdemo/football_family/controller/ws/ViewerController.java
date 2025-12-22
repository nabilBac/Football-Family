package com.footballdemo.football_family.controller.ws;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Controller
public class ViewerController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConcurrentHashMap<String, AtomicInteger> viewerCounts = new ConcurrentHashMap<>();

    public ViewerController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/viewer/join")
    public void viewerJoin(Map<String, Object> body) {

        Object liveIdObj = body.get("liveId");
        if (liveIdObj == null) {
            System.err.println("❌ viewer/join sans liveId");
            return;
        }

        String liveId = liveIdObj.toString();
        viewerCounts.putIfAbsent(liveId, new AtomicInteger(0));
        int count = viewerCounts.get(liveId).incrementAndGet();

        // compteur pour CE live
        messagingTemplate.convertAndSend("/topic/viewers/" + liveId, count);

        System.out.println("👤 Viewer rejoint live " + liveId + " — total = " + count);

        // notifier le streamer de CE live
        messagingTemplate.convertAndSend("/topic/viewer-joined/" + liveId, "new");
    }

    @MessageMapping("/viewer/leave")
    public void viewerLeave(Map<String, Object> body) {

        Object liveIdObj = body.get("liveId");
        if (liveIdObj == null) {
            System.err.println("❌ viewer/leave sans liveId");
            return;
        }

        String liveId = liveIdObj.toString();
        viewerCounts.putIfAbsent(liveId, new AtomicInteger(0));
        int count = Math.max(0, viewerCounts.get(liveId).decrementAndGet());

        messagingTemplate.convertAndSend("/topic/viewers/" + liveId, count);

        System.out.println("👋 Viewer quitte live " + liveId + " — total = " + count);
    }
}
