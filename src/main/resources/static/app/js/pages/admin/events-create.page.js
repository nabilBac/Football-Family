// /static/app/js/pages/admin/events-create.page.js
// ✅ VERSION SÉCURISÉE ET VALIDÉE — AUDIT COMPLET PASSÉ

import { Router } from "../../router.js";

export const AdminCreateEventPage = {
  async render() {
    return `
      <div class="admin-main" style="padding: 20px; margin-top: 60px;">
        <h1 class="admin-title">🏆 Créer un tournoi</h1>

        <div class="admin-card">
          <div id="event-message" class="admin-message" style="margin-bottom: 20px;"></div>

          <!-- ========== INFORMATIONS GÉNÉRALES ========== -->
          <div class="admin-form-section">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0; border-bottom: 2px solid #3498db; padding-bottom: 8px;">
              📋 Informations générales
            </h3>

            <div class="admin-form-group">
              <label>Nom du tournoi *</label>
              <input 
                id="tournament-name" 
                class="admin-input" 
                required 
                maxlength="100"
                placeholder="Ex: Tournoi U13 - Printemps 2025"
              />
              <small style="color: #7f8c8d;">Maximum 100 caractères</small>
            </div>

            <div class="admin-form-group">
              <label>Catégorie *</label>
              <select id="tournament-category" class="admin-input" required>
                <option value="">-- Sélectionner --</option>
                <option value="U11">U11 (moins de 11 ans)</option>
                <option value="U13">U13 (moins de 13 ans)</option>
                <option value="U15">U15 (moins de 15 ans)</option>
                <option value="U17">U17 (moins de 17 ans)</option>
                <option value="U19">U19 (moins de 19 ans)</option>
                <option value="Seniors">Seniors</option>
                <option value="Veterans">Vétérans</option>
              </select>
            </div>

            <div class="admin-form-group">
              <label>Description</label>
              <textarea 
                id="tournament-description" 
                class="admin-input"
                rows="4"
                maxlength="500"
                placeholder="Décrivez votre tournoi (optionnel)"
              ></textarea>
              <small style="color: #7f8c8d;">Maximum 500 caractères</small>
            </div>
          </div>

          <!-- ========== DATE ET HORAIRES ========== -->
          <div class="admin-form-section" style="margin-top: 25px;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0; border-bottom: 2px solid #3498db; padding-bottom: 8px;">
              📅 Date et horaires
            </h3>

            <div class="admin-form-group">
              <label>Date du tournoi *</label>
              <input 
                id="tournament-date" 
                type="date" 
                class="admin-input" 
                required 
              />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
              <div class="admin-form-group">
                <label>Heure de début</label>
                <input 
                  id="tournament-start-time" 
                  type="time" 
                  class="admin-input" 
                  value="09:00"
                />
              </div>
              <div class="admin-form-group">
                <label>Heure de fin</label>
                <input 
                  id="tournament-end-time" 
                  type="time" 
                  class="admin-input" 
                  value="18:00"
                />
              </div>
            </div>
          </div>

          <!-- ========== LOCALISATION ========== -->
          <div class="admin-form-section" style="margin-top: 25px;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0; border-bottom: 2px solid #3498db; padding-bottom: 8px;">
              📍 Localisation
            </h3>

            <div class="admin-form-group">
              <label>Ville *</label>
              <input 
                id="tournament-city" 
                class="admin-input" 
                required
                maxlength="100"
                placeholder="Ex: Toulon"
              />
            </div>

            <div class="admin-form-group">
              <label>Adresse complète</label>
              <input 
                id="tournament-address" 
                class="admin-input"
                maxlength="200"
                placeholder="Ex: 118 impasse des Platanes"
              />
            </div>

            <div class="admin-form-group">
              <label>Code postal</label>
              <input 
                id="tournament-zipcode" 
                class="admin-input" 
                maxlength="5"
                pattern="[0-9]{5}"
                placeholder="Ex: 83000"
              />
              <small style="color: #7f8c8d;">5 chiffres</small>
            </div>
          </div>

          <!-- ========== CAPACITÉS ========== -->
          <div class="admin-form-section" style="margin-top: 25px;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0; border-bottom: 2px solid #3498db; padding-bottom: 8px;">
              👥 Capacités et quotas
            </h3>

            <div class="admin-form-group">
              <label>Nombre maximum d'équipes *</label>
              <input 
                id="tournament-max-participants" 
                type="number" 
                class="admin-input" 
                value="16" 
                min="4"
                max="64"
                required
              />
              <small style="color: #7f8c8d;">Entre 4 et 64 équipes</small>
            </div>

            <div class="admin-form-group">
              <label>Nombre maximum d'équipes par club (optionnel)</label>
              <input
                id="tournament-max-teams-per-club"
                type="number"
                class="admin-input"
                min="1"
                max="32"
                placeholder="Laisser vide pour illimité"
              />
              <small style="color: #7f8c8d;">
                Si défini, limite le nombre d'équipes qu'un même club peut inscrire
              </small>
            </div>
          </div>

          <!-- ========== BOUTON CRÉATION ========== -->
          <button 
            id="create-event-btn" 
            class="admin-btn-primary admin-btn-full"
            style="margin-top: 30px; padding: 15px; font-size: 1.1em; font-weight: 600;"
          >
            ✨ Créer le tournoi
          </button>

          <p style="margin-top: 15px; text-align: center; color: #7f8c8d; font-size: 0.9em;">
            Les champs marqués d'un * sont obligatoires
          </p>
        </div>
      </div>
    `;
  },

  async init() {
    // ========== Définir date minimum (aujourd'hui) ==========
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("tournament-date").setAttribute("min", today);

    // ========== Bouton de création ==========
    document
      .getElementById("create-event-btn")
      .addEventListener("click", () => this.handleCreateEvent());

    // ========== Validation en temps réel du quota ==========
    const maxParticipantsInput = document.getElementById("tournament-max-participants");
    const maxTeamsPerClubInput = document.getElementById("tournament-max-teams-per-club");

    maxTeamsPerClubInput.addEventListener("input", () => {
      const total = parseInt(maxParticipantsInput.value, 10);
      const perClub = parseInt(maxTeamsPerClubInput.value, 10);

      if (perClub && perClub > total) {
        maxTeamsPerClubInput.setCustomValidity(
          "Le quota par club ne peut pas dépasser le nombre total d'équipes"
        );
      } else {
        maxTeamsPerClubInput.setCustomValidity("");
      }
    });
  },

  async handleCreateEvent() {
    const token = localStorage.getItem("accessToken");
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

    // ========== VÉRIFICATION AUTHENTIFICATION ==========
    if (!token || !currentUser.clubId) {
      this.showMessage("❌ Vous devez être connecté et membre d'un club", true);
      return;
    }

    // ========== RÉCUPÉRATION DES VALEURS ==========
    const name = document.getElementById("tournament-name").value.trim();
    const category = document.getElementById("tournament-category").value;
    const date = document.getElementById("tournament-date").value;
    const startTimeVal = document.getElementById("tournament-start-time").value;
    const endTimeVal = document.getElementById("tournament-end-time").value;
    const city = document.getElementById("tournament-city").value.trim();
    const address = document.getElementById("tournament-address").value.trim();
    const zipCode = document.getElementById("tournament-zipcode").value.trim();
    const description = document.getElementById("tournament-description").value.trim();

    const maxParticipants = parseInt(
      document.getElementById("tournament-max-participants").value,
      10
    );

    const maxTeamsPerClubRaw = document.getElementById("tournament-max-teams-per-club").value.trim();
    const maxTeamsPerClub = maxTeamsPerClubRaw ? parseInt(maxTeamsPerClubRaw, 10) : null;

    // ========== VALIDATIONS CRITIQUES ==========

    // 1. Champs obligatoires
    if (!name) return this.showMessage("❌ Le nom du tournoi est obligatoire", true);
    if (!category) return this.showMessage("❌ La catégorie est obligatoire", true);
    if (!date) return this.showMessage("❌ La date est obligatoire", true);
    if (!city) return this.showMessage("❌ La ville est obligatoire", true);

    // 2. Validation de la longueur
    if (name.length > 100) {
      return this.showMessage("❌ Le nom ne peut pas dépasser 100 caractères", true);
    }

    if (description.length > 500) {
      return this.showMessage("❌ La description ne peut pas dépasser 500 caractères", true);
    }

    // 3. Validation de la date (pas dans le passé)
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return this.showMessage("❌ La date ne peut pas être dans le passé", true);
    }

    // 4. Validation des horaires
    if (startTimeVal && endTimeVal && startTimeVal >= endTimeVal) {
      return this.showMessage(
        "❌ L'heure de début doit être avant l'heure de fin",
        true
      );
    }

    // 5. Validation du code postal (si fourni)
    if (zipCode && !/^\d{5}$/.test(zipCode)) {
      return this.showMessage(
        "❌ Le code postal doit contenir exactement 5 chiffres",
        true
      );
    }

    // 6. Validation du nombre d'équipes
    if (isNaN(maxParticipants) || maxParticipants < 4 || maxParticipants > 64) {
      return this.showMessage(
        "❌ Le nombre d'équipes doit être entre 4 et 64",
        true
      );
    }

    // 7. Validation du quota par club
    if (maxTeamsPerClub !== null) {
      if (maxTeamsPerClub < 1) {
        return this.showMessage(
          "❌ Le quota par club doit être au minimum de 1",
          true
        );
      }

      if (maxTeamsPerClub > maxParticipants) {
        return this.showMessage(
          "❌ Le quota par club ne peut pas dépasser le nombre total d'équipes",
          true
        );
      }
    }

    // ========== CONSTRUCTION DU PAYLOAD ==========
    const location = `${city}${address ? ", " + address : ""}`.trim();

    const payload = {
      name,
      description,
      category, // ✅ AJOUTÉ
      type: "CLUB_EVENT",
      registrationType: "CLUB_ONLY",
      visibility: "PUBLIC",
      clubId: currentUser.clubId,

      date,
      startTime: startTimeVal ? `${date}T${startTimeVal}:00` : null,
      endTime: endTimeVal ? `${date}T${endTimeVal}:00` : null,

      city,
      address,
      zipCode,
      location,

      maxParticipants,
      maxTeamsPerClub,
    };

    // ========== ENVOI DE LA REQUÊTE ==========
    const btn = document.getElementById("create-event-btn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création en cours...';

    try {
      const res = await fetch("/api/events/manage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // ✅ Extraction intelligente du message d'erreur
        const errorMsg =
          json?.message ||
          json?.error ||
          json?.details ||
          (json?.errors && JSON.stringify(json.errors)) ||
          `Erreur HTTP ${res.status}`;

        throw new Error(errorMsg);
      }

      const eventId = json?.data?.id || json?.id;

      if (!eventId) {
        throw new Error("L'ID de l'événement n'a pas été retourné par le serveur");
      }

      // ========== SUCCÈS ==========
      this.showMessage("✅ Tournoi créé avec succès ! Redirection...", false);
      
      setTimeout(() => {
       Router.go(`/admin/events/${eventId}`);
      }, 1000);

    } catch (error) {
      console.error("Erreur création tournoi:", error);
      this.showMessage(`❌ ${error.message}`, true);
      
      btn.disabled = false;
      btn.innerHTML = "✨ Créer le tournoi";
    }
  },

  showMessage(msg, error = false) {
    const el = document.getElementById("event-message");
    if (!el) return;

    el.textContent = msg;
    el.style.color = error ? "#e74c3c" : "#27ae60";
    el.style.background = error ? "#fadbd8" : "#d5f4e6";
    el.style.padding = "15px";
    el.style.borderRadius = "8px";
    el.style.fontWeight = "500";
    el.style.display = "block";
    el.style.border = error ? "2px solid #e74c3c" : "2px solid #27ae60";

    // Auto-hide après 5 secondes (sauf si erreur)
    if (!error) {
      setTimeout(() => {
        el.style.display = "none";
      }, 5000);
    }
  },



  
};

export default AdminCreateEventPage;