document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // escape helper to avoid injecting raw HTML
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

  // Clear loading message
  activitiesList.innerHTML = "";

  // Clear activity dropdown before repopulating
  activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

  // Populate activities list
  Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participantsArr = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = details.max_participants - participantsArr.length;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (avatar + email list)
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("strong");
        participantsTitle.textContent = "Participants";
        participantsSection.appendChild(participantsTitle);

        if (participantsArr.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          participantsArr.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // avatar: first char of local-part of email
            const localPart = String(p).split("@")[0] || "";
            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            avatar.textContent = localPart.charAt(0).toUpperCase() || "?";

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = p; // safe because textContent is used

            // Delete icon
            const deleteIcon = document.createElement("span");
            deleteIcon.className = "delete-icon";
            deleteIcon.title = "Unregister participant";
            deleteIcon.innerHTML = "&#128465;"; // Unicode trash can
            deleteIcon.style.cursor = "pointer";
            deleteIcon.onclick = async () => {
              if (confirm(`Unregister ${p} from ${name}?`)) {
                try {
                  const response = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`, {
                    method: "POST"
                  });
                  if (response.ok) {
                    fetchActivities();
                  } else {
                    alert("Failed to unregister participant.");
                  }
                } catch (err) {
                  alert("Error unregistering participant.");
                }
              }
            };

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            li.appendChild(deleteIcon);
            ul.appendChild(li);
          });

          participantsSection.appendChild(ul);
        } else {
          const noP = document.createElement("p");
          noP.className = "info";
          noP.textContent = "No participants yet.";
          participantsSection.appendChild(noP);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
  messageDiv.textContent = result.message;
  messageDiv.className = "success";
  signupForm.reset();
  fetchActivities(); // Refresh activities after signup
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
