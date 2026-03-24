---
id: intro
title: Introduction to SOLID Principles
sidebar_position: 1
slug: /technical-knowledge/solid
---

# Introduction to SOLID Principles

Welcome! This guide will walk you through the **SOLID principles** — five essential design principles that help you write Java code that is **clean, scalable, and easy to maintain**.

## 🤔 Why Should You Care?

Imagine you wrote a feature last month. Now your teammate asks you to change it. You open the file and… it's a mess. One class does 10 things. Changing one thing breaks another. You're afraid to touch it.

That's what happens **without** SOLID.

SOLID gives you a set of guidelines so your code stays healthy as it grows — especially in large Spring applications.

---

## 📦 What is SOLID?

**SOLID** is an acronym introduced by Robert C. Martin (Uncle Bob):

| Letter | Principle | One-liner |
|--------|-----------|-----------|
| **S** | [Single Responsibility](/technical-knowledge/solid/solid/single-responsibility) | One class, one job |
| **O** | [Open/Closed](/technical-knowledge/solid/solid/open-closed) | Open to extend, closed to modify |
| **L** | [Liskov Substitution](/technical-knowledge/solid/solid/liskov-substitution) | Subtypes must behave like their parent |
| **I** | [Interface Segregation](/technical-knowledge/solid/solid/interface-segregation) | Don't force classes to implement what they don't need |
| **D** | [Dependency Inversion](/technical-knowledge/solid/solid/dependency-inversion) | Depend on abstractions, not concretions |

---

## 🎯 Who Is This For?

- Java developers who are **new to design principles**
- Developers starting to use **Spring Boot** and wondering why code gets messy
- Anyone who wants to write code their teammates will love

---

## 🚀 How to Use This Guide

Each principle has:
1. **A simple explanation** — no jargon
2. **A ❌ Bad Example** — code that violates the principle
3. **A ✅ Good Example** — refactored clean code
4. **Real-world Spring context** — where you'd actually apply it

Start with [Single Responsibility →](/technical-knowledge/solid/solid/single-responsibility)
