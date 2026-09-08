package com.theadbasket.backend.common.logging;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

/** Unit tests for {@link LoggingAspect} — behavior of the entry/exit advice at various levels. */
class LoggingAspectTest {

    private final LoggingAspect aspect = new LoggingAspect();
    private Logger logger;
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void attachAppender() {
        logger = (Logger) LoggerFactory.getLogger(LoggingAspect.class);
        appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
    }

    @AfterEach
    void detachAppender() {
        logger.detachAppender(appender);
        logger.setLevel(null);
    }

    private ProceedingJoinPoint joinPoint(Object result, Throwable toThrow) throws Throwable {
        Signature signature = mock(Signature.class);
        when(signature.getDeclaringType()).thenReturn(LoggingAspectTest.class);
        when(signature.getName()).thenReturn("sampleMethod");
        ProceedingJoinPoint jp = mock(ProceedingJoinPoint.class);
        when(jp.getSignature()).thenReturn(signature);
        if (toThrow != null) {
            when(jp.proceed()).thenThrow(toThrow);
        } else {
            when(jp.proceed()).thenReturn(result);
        }
        return jp;
    }

    @Test
    void returnsTargetValueAndLogsEntryExitAtDebug() throws Throwable {
        logger.setLevel(Level.DEBUG);
        ProceedingJoinPoint jp = joinPoint("ok", null);

        Object result = aspect.logEntryExit(jp);

        assertThat(result).isEqualTo("ok");
        assertThat(appender.list).hasSize(2);
        assertThat(appender.list.get(0).getFormattedMessage()).contains("→", "sampleMethod");
        assertThat(appender.list.get(1).getFormattedMessage()).contains("←", "ms");
    }

    @Test
    void shortCircuitsWithoutTouchingSignatureWhenDebugDisabled() throws Throwable {
        logger.setLevel(Level.INFO);
        ProceedingJoinPoint jp = joinPoint("ok", null);

        Object result = aspect.logEntryExit(jp);

        assertThat(result).isEqualTo("ok");
        verify(jp).proceed();
        verify(jp, never()).getSignature(); // no target string built when tracing is off
        assertThat(appender.list).isEmpty();
    }

    @Test
    void rethrowsExceptionTransparentlyAndLogsFailure() throws Throwable {
        logger.setLevel(Level.DEBUG);
        RuntimeException boom = new IllegalStateException("boom");
        ProceedingJoinPoint jp = joinPoint(null, boom);

        assertThatThrownBy(() -> aspect.logEntryExit(jp)).isSameAs(boom);
        assertThat(appender.list).anySatisfy(
                event -> assertThat(event.getFormattedMessage()).contains("✗", "IllegalStateException"));
    }
}
