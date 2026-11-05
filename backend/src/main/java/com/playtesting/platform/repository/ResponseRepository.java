package com.playtesting.platform.repository;

import com.playtesting.platform.entity.Response;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResponseRepository extends JpaRepository<Response, Long> {

    List<Response> findAllByFormGameIdOrderBySubmittedAtDesc(Long gameId);
}
