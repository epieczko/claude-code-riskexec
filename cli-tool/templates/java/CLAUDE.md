# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Java project optimized for modern Java development. The project uses industry-standard tools and follows best practices for scalable application development.

## Development Commands

### Environment Management
- `java -version` - Check Java version
- `sdk list java` - List available JDKs (SDKMAN)
- `sdk install java 21-tem` - Install specific JDK
- `sdk use java 21-tem` - Activate installed JDK
- `mvn -v` - Check Maven version
- `gradle -v` - Check Gradle version

### Build and Run
- `mvn compile` - Compile project with Maven
- `mvn package` - Package application into JAR/WAR
- `mvn spring-boot:run` - Run Spring Boot application
- `gradle build` - Build project with Gradle
- `gradle bootRun` - Run Spring Boot app with Gradle
- `java -jar target/app.jar` - Run packaged application

### Testing Commands
- `mvn test` - Run unit tests with Maven
- `mvn verify` - Run tests and integration tests
- `gradle test` - Run unit tests with Gradle
- `gradle clean test` - Clean and run tests
- `gradle test --info` - Run tests with detailed output

### Code Quality Commands
- `mvn checkstyle:check` - Run Checkstyle
- `mvn pmd:check` - Run PMD static analysis
- `mvn spotbugs:check` - Run SpotBugs
- `gradle checkstyleMain` - Checkstyle with Gradle
- `gradle spotbugsMain` - SpotBugs with Gradle
- `mvn jacoco:report` - Generate coverage report
- `gradle jacocoTestReport` - Generate coverage report

### Development Tools
- `mvn dependency:tree` - View dependency tree
- `gradle dependencies` - Show Gradle dependencies
- `mvn spring-boot:run -Dspring-boot.run.profiles=dev` - Run with profile

## Technology Stack

### Core Technologies
- **Java 17+** - Primary programming language
- **Maven** - Build automation tool
- **Gradle** - Alternative build automation tool

### Common Frameworks
- **Spring Boot** - Opinionated framework for building microservices
- **Jakarta EE** - Enterprise Java platform
- **Micronaut** - JVM-based framework for microservices
- **Quarkus** - Kubernetes native Java stack

### Testing Frameworks
- **JUnit 5** - Unit testing framework
- **TestNG** - Testing framework alternative
- **Mockito** - Mocking framework
- **AssertJ** - Fluent assertions

### Code Quality Tools
- **Checkstyle** - Style and convention checks
- **SpotBugs** - Static analysis
- **PMD** - Source code analyzer
- **Jacoco** - Code coverage

## Project Structure Guidelines

### Maven/Gradle Standard Layout
```
src/
  main/
    java/         # Application source code
    resources/    # Configuration and static resources
  test/
    java/         # Test source code
    resources/    # Test resources
pom.xml or build.gradle
```

### Naming Conventions
- **Packages**: Lowercase reversed domain names (`com.example.project`)
- **Classes**: PascalCase (`UserService`)
- **Methods/Variables**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_SIZE`)

## Build Configuration

### Maven Example
```xml
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>demo</artifactId>
  <version>1.0.0</version>
  <properties>
    <java.version>17</java.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>
```

### Gradle Example
```groovy
plugins {
  id 'java'
  id 'org.springframework.boot' version '3.2.0'
}

java {
  toolchain {
    languageVersion = JavaLanguageVersion.of(17)
  }
}

dependencies {
  implementation 'org.springframework.boot:spring-boot-starter-web'
  testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

## Development Workflow

### Before Starting
1. Install JDK 17 or newer
2. Install Maven or Gradle
3. Configure IDE with necessary plugins

### During Development
1. Write tests alongside code
2. Run `mvn test` or `gradle test` frequently
3. Use meaningful commit messages and small commits
4. Run static analysis tools regularly

### Before Committing
1. Run full test suite
2. Run code quality checks (Checkstyle, SpotBugs, PMD)
3. Ensure code formatting is applied
4. Build project successfully (`mvn package` or `gradle build`)

## Security Guidelines
- Regularly update dependencies (`mvn versions:display-dependency-updates`, `gradle versions`)
- Use OWASP Dependency Check
- Avoid committing secrets or credentials
- Validate and sanitize user input
- Enable HTTPS and secure headers in production

## Performance Considerations
- Profile applications using JFR or VisualVM
- Monitor memory usage and garbage collection
- Use asynchronous processing for heavy tasks
- Optimize database interactions with indexes and caching
