package com.veritas.backend.repository;

import com.veritas.backend.entity.Inquiry;
import com.veritas.backend.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    long countByUser(User user);

    List<Inquiry> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
}
