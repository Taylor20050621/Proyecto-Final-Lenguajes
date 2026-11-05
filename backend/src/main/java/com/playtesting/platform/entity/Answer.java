package com.playtesting.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "answers")
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "response_id", nullable = false)
    private Response response;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "answer_text")
    private String answerText;

    @Column(name = "numeric_value", precision = 10, scale = 2)
    private BigDecimal numericValue;

    public Long getId() {
        return id;
    }

    public void setResponse(Response response) {
        this.response = response;
    }

    public void setQuestion(Question question) {
        this.question = question;
    }

    public void setAnswerText(String answerText) {
        this.answerText = answerText;
    }

    public void setNumericValue(BigDecimal numericValue) {
        this.numericValue = numericValue;
    }

    public Question getQuestion() {
        return question;
    }

    public String getAnswerText() {
        return answerText;
    }

    public BigDecimal getNumericValue() {
        return numericValue;
    }
}
