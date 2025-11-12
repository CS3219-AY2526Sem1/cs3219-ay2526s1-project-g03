[![codecov](https://codecov.io/github/cs3219-ay2526sem1/cs3219-ay2526s1-project-g03/branch/develop/graph/badge.svg?token=H8J2691IYM)](https://codecov.io/github/cs3219-ay2526sem1/cs3219-ay2526s1-project-g03)

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QUdQy4ix)

# CS3219 Project (PeerPrep) - AY2526S1

## Group: G03

### Note:

- You are required to develop individual microservices within separate folders within this
  repository.
- The teaching team should be given access to the repositories as we may require viewing the history
  of the repository in case of any disputes or disagreements.

## Setup
1. Clone the repository
1. Configure environment variables in the following folders
  - Root directory
  - question-service
  - matching-service
  - frontend
  - collaboration-service
  - Tip: JWT can be generated using `openssl rand -base64 32`

## Running the Application
1. `docker compose up --build`
1. Once everything is running, go to the [welcome page](http://localhost:3000)
