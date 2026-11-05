package com.playtesting.platform.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "responses")
public class Response {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "form_id", nullable = false)
    private Form form;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tester_id", nullable = false)
    private User tester;

    @Column(name = "submitted_at", nullable = false)
    private OffsetDateTime submittedAt;

    @OneToMany(mappedBy = "response", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Answer> answers = new ArrayList<>();

    @PrePersist
    void setSubmittedAt() {
        if (submittedAt == null) {
            submittedAt = OffsetDateTime.now(ZoneOffset.UTC);
        }
    }

    public Long getId() {
        return id;
    }

    public void setForm(Form form) {
        this.form = form;
    }

    public void setTester(User tester) {
        this.tester = tester;
    }

    public List<Answer> getAnswers() {
        return answers;
    }

    public OffsetDateTime getSubmittedAt() {
        return submittedAt;
    }

    public Form getForm() {
        return form;
    }

    public User getTester() {
        return tester;
    }

    public void addAnswer(Answer answer) {
        answers.add(answer);
        answer.setResponse(this);
    }
}
