package com.veritas.backend.dto.bookmark;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class BookmarkRequest {
    @JsonProperty("article_id")
    private Long articleId;
}
