// backend/src/main/java/com/veritas/backend/exception/GlobalExceptionHandler.java
package com.veritas.backend.exception;

import com.veritas.backend.dto.common.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex) {
        return ResponseEntity
            .status(ex.getStatus())
            .body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleOther(Exception ex) {
        return ResponseEntity
            .status(500)
            .body(new ErrorResponse("Internal server error"));
    }
}
