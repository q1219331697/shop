package com.shop.api.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.metrics.buffering.BufferingApplicationStartup;
import org.springframework.boot.context.metrics.buffering.StartupTimeline;
import org.springframework.boot.context.metrics.buffering.StartupTimeline.TimelineEvent;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.metrics.ApplicationStartup;
import org.springframework.core.metrics.StartupStep;
import org.springframework.lang.NonNull;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * 启动耗时日志记录器
 * 在应用启动完成后，自动将各阶段耗时信息输出到日志
 *
 * @since 1.0.0
 */
public class StartupLoggingListener implements ApplicationListener<ApplicationReadyEvent> {

    private static final Logger LOG = LoggerFactory.getLogger(StartupLoggingListener.class);

    private static final int TOP_COUNT = 15;
    private static final double PERCENT_FACTOR = 100.0;
    private static final double MILLIS_TO_SECONDS = 1000.0;

    @Override
    public void onApplicationEvent(@NonNull ApplicationReadyEvent event) {
        ApplicationStartup startup = event.getSpringApplication().getApplicationStartup();
        if (!(startup instanceof BufferingApplicationStartup buffering)) {
            LOG.info("Startup metrics not available (BufferingApplicationStartup not configured)");
            return;
        }

        StartupTimeline timeline = buffering.drainBufferedTimeline();
        List<TimelineEvent> events = timeline.getEvents();

        if (events.isEmpty()) {
            LOG.info("No startup steps recorded");
            return;
        }

        // Parse durations and find top-level events (no parent)
        List<StepInfo> topLevel = new ArrayList<>();
        List<StepInfo> allSteps = new ArrayList<>();

        for (TimelineEvent timelineEvent : events) {
            StepInfo info = new StepInfo(timelineEvent);
            allSteps.add(info);
            if (info.parentId == null || info.parentId == -1) {
                topLevel.add(info);
            }
        }

        // Sort all steps by duration descending for top N
        allSteps.sort(Comparator.comparingDouble(StepInfo::getDurationSeconds).reversed());

        // Log summary
        double totalDuration = topLevel.stream().mapToDouble(StepInfo::getDurationSeconds).sum();

        LOG.info("==========================================================");
        LOG.info("  Spring Boot 启动耗时分析");
        LOG.info("==========================================================");
        LOG.info("  总启动耗时: {}s", String.format("%.3f", totalDuration));
        LOG.info("  总事件数: {}", allSteps.size());
        LOG.info("----------------------------------------------------------");
        LOG.info("  主要阶段耗时:");

        for (StepInfo info : topLevel) {
            double pct = totalDuration > 0 ? info.getDurationSeconds() / totalDuration * PERCENT_FACTOR : 0;
            LOG.info("    {} {} ({}%)",
                    String.format("%-55s", info.name),
                    String.format("%8.3fs", info.getDurationSeconds()),
                    String.format("%5.1f", pct));
        }

        LOG.info("----------------------------------------------------------");
        LOG.info("  耗时最长的 Top {}:", TOP_COUNT);

        int topN = Math.min(TOP_COUNT, allSteps.size());
        for (int i = 0; i < topN; i++) {
            StepInfo info = allSteps.get(i);
            String beanName = info.beanName;
            String displayName = beanName != null && !beanName.isEmpty()
                    ? info.name + " [" + beanName + "]"
                    : info.name;
            LOG.info("    {}. {} {}",
                    String.format("%2d", i + 1),
                    String.format("%-50s", displayName),
                    String.format("%8.3fs", info.getDurationSeconds()));
        }

        LOG.info("==========================================================");
    }

    private static class StepInfo {
        final String name;
        final String beanName;
        final Long parentId;
        final Duration duration;

        StepInfo(TimelineEvent timelineEvent) {
            StartupStep step = timelineEvent.getStartupStep();
            this.name = step.getName();
            this.parentId = step.getParentId();
            this.duration = timelineEvent.getDuration();
            String bean = null;
            for (StartupStep.Tag tag : step.getTags()) {
                if ("beanName".equals(tag.getKey())) {
                    bean = tag.getValue();
                    break;
                }
            }
            this.beanName = bean;
        }

        double getDurationSeconds() {
            return duration.toMillis() / MILLIS_TO_SECONDS;
        }
    }
}
