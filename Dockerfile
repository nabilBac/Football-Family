# ---- build stage ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -q -e -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package

# ---- run stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app

# ✅ INSTALLER FFMPEG (AJOUTE CETTE LIGNE)
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# (optionnel mais utile) créer un dossier data pour H2 file
RUN mkdir -p /app/data /app/uploads /app/videos

COPY --from=build /app/target/*.jar app.jar

ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["sh","-c","java -Xmx400m -Xms200m -Dserver.port=${PORT} -jar /app/app.jar"]