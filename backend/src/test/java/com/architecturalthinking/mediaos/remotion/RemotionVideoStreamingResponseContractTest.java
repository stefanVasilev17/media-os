package com.architecturalthinking.mediaos.remotion;

import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBodyReturnValueHandler;

import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class RemotionVideoStreamingResponseContractTest {

    @Test
    void verifiedS3AndLegacyVideoEndpointsUseMvcStreamingHandlerRatherThanMp4MessageConverters()
            throws Exception {
        Method endpoint=RemotionRenderController.class.getMethod(
                "video",UUID.class,String.class);
        MethodParameter returnType=new MethodParameter(endpoint,-1);
        assertTrue(new StreamingResponseBodyReturnValueHandler().supportsReturnType(returnType),
                "Spring MVC must select StreamingResponseBodyReturnValueHandler for private S3 MP4, " +
                "not HttpMessageConverter (the old ResponseEntity<?> returned HTTP 500).");
        assertEquals(ResponseEntity.class,endpoint.getReturnType());
        assertInstanceOf(ParameterizedType.class,endpoint.getGenericReturnType());
        ParameterizedType generic=(ParameterizedType)endpoint.getGenericReturnType();
        assertEquals(StreamingResponseBody.class,generic.getActualTypeArguments()[0],
                "Both full and Range requests must preserve typed StreamingResponseBody.");
    }
}
