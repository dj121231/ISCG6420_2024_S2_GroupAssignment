document.addEventListener("DOMContentLoaded", () => {
  // Set default check-in and check-out dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Function to format dates as 'YYYY-MM-DD'
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Set default check-in and check-out date values
  const checkinInput = document.getElementById("checkin");
  const checkoutInput = document.getElementById("checkout");
  checkinInput.value = formatDate(today);
  checkoutInput.value = formatDate(tomorrow);

  // Restrict selection of past dates
  checkinInput.setAttribute("min", formatDate(today));
  checkoutInput.setAttribute("min", formatDate(tomorrow));

  // Update minimum checkout date when check-in date changes
  checkinInput.addEventListener("change", () => {
    const checkinDate = new Date(checkinInput.value);
    const nextDay = new Date(checkinDate);
    nextDay.setDate(checkinDate.getDate() + 1);
    checkoutInput.setAttribute("min", formatDate(nextDay));
    if (new Date(checkoutInput.value) <= checkinDate) {
      checkoutInput.value = formatDate(nextDay);
    }
  });

  // Specify the XML file path and load data
  fetch("assets/data/parakai.xml")
    .then((response) => response.text())
    .then((xmlText) => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");
      const zones = xmlDoc.getElementsByTagName("zone");

      Array.from(zones).forEach((zone) => {
        const id = zone.getAttribute("id");
        const name = zone.getElementsByTagName("name")[0].textContent;
        const capacity =
          zone.getElementsByTagName("capacity-total")[0]?.textContent || "N/A";
        const price =
          zone.getElementsByTagName("price-per-night")[0]?.textContent || "N/A";
        const available =
          zone.getElementsByTagName("available")[0]?.textContent || "false";
        const imagePath =
          zone.getElementsByTagName("image-path")[0]?.textContent || "";

        const zoneElement = document.querySelector(`.zone${id}`);
        if (zoneElement) {
          zoneElement.setAttribute("data-zone", name);
          zoneElement.setAttribute("data-capacity-total", capacity);
          zoneElement.setAttribute("data-price", price);
          zoneElement.setAttribute("data-initial-available", available);
          zoneElement.setAttribute("data-available", available);
          zoneElement.setAttribute("data-image", imagePath);

          updateZoneAvailability(zoneElement, available);
        }
      });
    });

  // Function to set color based on availability
  function updateZoneAvailability(zoneElement, available) {
    zoneElement.style.backgroundColor =
      available === "false" ? "rgba(255, 0, 0, 0.7)" : "rgba(0, 255, 0, 0.7)";
  }

  const tooltip = document.getElementById("tooltip");
  const zoneElements = document.querySelectorAll(".zone-btn");

  // Set up tooltip display
  zoneElements.forEach((zone) => {
    zone.addEventListener("mouseenter", (event) => {
      const selectedLodge = zone.getAttribute("data-zone") || "N/A";
      const capacityTotal = zone.getAttribute("data-capacity-total") || "N/A";
      const price = zone.getAttribute("data-price") || "N/A";
      const available =
        zone.getAttribute("data-available") === "true" ? "Available" : "Booked";
      const imagePath = zone.getAttribute("data-image") || "";

      tooltip.innerHTML = `
        <strong>${selectedLodge}</strong><br>
        Capacity: ${capacityTotal}<br>
        Price: $${price}/night<br>
        Status: ${available}<br>
        ${
          imagePath
            ? `<img src="${imagePath}" alt="${selectedLodge}" style="width: 100px; height: auto;"/>`
            : ""
        }
      `;

      tooltip.style.left = `${event.pageX + 10}px`;
      tooltip.style.top = `${event.pageY + 10}px`;
      tooltip.style.display = "block";
    });

    zone.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  });

  // Check availability when Search button is clicked
  document.getElementById("search").addEventListener("click", () => {
    const adults = parseInt(document.getElementById("adults").value, 10);
    const children = parseInt(document.getElementById("children").value, 10);
    const totalPeople = adults + children;

    zoneElements.forEach((zone) => {
      const capacityTotal = parseInt(
        zone.getAttribute("data-capacity-total"),
        10
      );
      const initialAvailable = zone.getAttribute("data-initial-available");

      if (initialAvailable === "false") {
        zone.setAttribute("data-available", "false");
        updateZoneAvailability(zone, "false");
      } else if (totalPeople <= capacityTotal) {
        zone.setAttribute("data-available", "true");
        updateZoneAvailability(zone, "true");
      } else {
        zone.setAttribute("data-available", "false");
        updateZoneAvailability(zone, "false");
      }
    });
  });

  // Update booking details when an available zone is clicked
  zoneElements.forEach((zone) => {
    zone.addEventListener("click", () => {
      const available = zone.getAttribute("data-available") === "true";
      if (!available) {
        alert(" Please select an available zone.");
        return;
      }

      const selectedLodge = zone.getAttribute("data-zone");
      const capacityTotal = zone.getAttribute("data-capacity-total");
      const price = zone.getAttribute("data-price");
      const checkin = document.getElementById("checkin").value;
      const checkout = document.getElementById("checkout").value;
      const adults = document.getElementById("adults").value;
      const children = document.getElementById("children").value;

      document.getElementById("selected-lodge").textContent = selectedLodge;
      document.getElementById(
        "capacity-adults"
      ).textContent = `Adults: ${adults}`;
      document.getElementById(
        "capacity-children"
      ).textContent = `| Children: ${children}`;
      document.getElementById("selected-checkin").textContent =
        checkin || "N/A";
      document.getElementById("selected-checkout").textContent =
        checkout || "N/A";
      document.getElementById("price-per-night").textContent = `$${price}`;

      if (checkin && checkout && !isNaN(price)) {
        const totalPrice = calculateTotalPrice(checkin, checkout, price);
        document.getElementById("total-price").textContent = `$${totalPrice}`;
      } else {
        document.getElementById("total-price").textContent = "$0";
      }
    });
  });

  // Function to calculate total price based on check-in and check-out dates
  function calculateTotalPrice(checkin, checkout, pricePerNight) {
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const timeDifference = Math.abs(checkoutDate - checkinDate);
    const numberOfDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    return numberOfDays * pricePerNight;
  }

  // Show booking summary when Confirm button is clicked
  document.getElementById("confirm").addEventListener("click", () => {
    const adults = document.getElementById("adults").value;
    const children = document.getElementById("children").value;

    // Check if the number of people has been entered
    if (!adults || !children) {
      alert(
        "Please enter the number of adults and children before confirming."
      );
      return;
    }
    const selectedLodge = document.getElementById("selected-lodge").textContent;
    const capacityTotal =
      document.getElementById("capacity-adults").textContent +
      " " +
      document.getElementById("capacity-children").textContent;
    const pricePerNight =
      document.getElementById("price-per-night").textContent;
    const totalPrice = document.getElementById("total-price").textContent;
    const checkin = document.getElementById("selected-checkin").textContent;
    const checkout = document.getElementById("selected-checkout").textContent;

    if (selectedLodge === "N/A" || checkin === "N/A" || checkout === "N/A") {
      alert("Please ensure zone are selected before confirming.");
      return;
    }

    document.getElementById("summary-zone").textContent = selectedLodge;
    document.getElementById("summary-capacity").textContent = capacityTotal;
    document.getElementById("summary-checkin").textContent = checkin;
    document.getElementById("summary-checkout").textContent = checkout;
    document.getElementById("summary-price-per-night").textContent =
      pricePerNight;
    document.getElementById("summary-total-price").textContent = totalPrice;

    // Hide booking details and booking title, show booking summary
    document.getElementById("booking-details").style.display = "none";
    document.getElementById("booking-title").style.display = "none";
    document.getElementById("booking-summary").style.display = "block";
    // Hide the Clear button after Confirm is clicked
    document.getElementById("clear").style.display = "none";
    document.getElementById("confirm").style.display = "none";
  });

  // Reset booking information when Clear button is clicked
  document.getElementById("clear").addEventListener("click", () => {
    // Reset booking details
    document.getElementById("selected-lodge").textContent = "N/A";
    document.getElementById("capacity-adults").textContent = "Adults: ";
    document.getElementById("capacity-children").textContent = "| Children: ";
    document.getElementById("selected-checkin").textContent = "N/A";
    document.getElementById("selected-checkout").textContent = "N/A";
    document.getElementById("price-per-night").textContent = "$0";
    document.getElementById("total-price").textContent = "$0";
  });
  // Display the Clear button again until Confirm is clicked
  document.getElementById("clear").style.display = "inline-block";
});
