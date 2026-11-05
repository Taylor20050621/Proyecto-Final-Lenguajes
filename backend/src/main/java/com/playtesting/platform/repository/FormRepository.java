package com.playtesting.platform.repository;

import com.playtesting.platform.entity.Form;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FormRepository extends JpaRepository<Form, Long> {

    Optional<Form> findByGameIdAndActiveTrue(Long gameId);

}
