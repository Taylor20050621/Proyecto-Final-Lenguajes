package com.playtesting.platform.repository;

import com.playtesting.platform.entity.Game;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameRepository extends JpaRepository<Game, Long> {

    List<Game> findAllByOrderByCreatedAtDesc();
}
