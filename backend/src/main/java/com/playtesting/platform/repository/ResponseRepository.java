package com.playtesting.platform.repository;

import com.playtesting.platform.entity.Response;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResponseRepository extends JpaRepository<Response, Long> {

    List<Response> findAllByFormGameIdOrderBySubmittedAtDesc(Long gameId);

    long countByTesterId(Long testerId);

    boolean existsByTesterIdAndFormGameIdAndEvaluatedVersion(
            Long testerId, Long gameId, String evaluatedVersion);

    List<Response> findAllByTesterIdOrderBySubmittedAtDesc(Long testerId);

    List<Response> findAllByFormGameCreatorId(Long creatorId);
}
