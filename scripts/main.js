document.addEventListener("DOMContentLoaded", () => {
  // 체크인, 체크아웃 날짜 기본값 설정
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // 날짜를 'YYYY-MM-DD' 형식으로 변환하는 함수
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // 체크인과 체크아웃 날짜 기본값 설정
  const checkinInput = document.getElementById("checkin");
  const checkoutInput = document.getElementById("checkout");
  checkinInput.value = formatDate(today);
  checkoutInput.value = formatDate(tomorrow);

  // 과거 날짜 선택을 제한
  checkinInput.setAttribute("min", formatDate(today));
  checkoutInput.setAttribute("min", formatDate(tomorrow));

  // 체크인 날짜 변경 시 체크아웃 최소 날짜 업데이트
  checkinInput.addEventListener("change", () => {
    const checkinDate = new Date(checkinInput.value);
    const nextDay = new Date(checkinDate);
    nextDay.setDate(checkinDate.getDate() + 1);
    checkoutInput.setAttribute("min", formatDate(nextDay));
    if (new Date(checkoutInput.value) <= checkinDate) {
      checkoutInput.value = formatDate(nextDay);
    }
  });
  // XML 파일 경로 지정 및 데이터 로드
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

  // 예약 가능 여부에 따른 색상 설정 함수
  function updateZoneAvailability(zoneElement, available) {
    zoneElement.style.backgroundColor =
      available === "false" ? "rgba(255, 0, 0, 0.7)" : "rgba(0, 255, 0, 0.7)";
  }

  const tooltip = document.getElementById("tooltip");
  const zoneElements = document.querySelectorAll(".zone-btn");

  // Tooltip 표시 설정
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

  // Search 버튼 클릭 시 예약 가능 여부 확인
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

  // 예약 가능한 구역 클릭 시 Booking details 업데이트
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

  // 총 가격 계산 함수
  function calculateTotalPrice(checkin, checkout, pricePerNight) {
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const timeDifference = Math.abs(checkoutDate - checkinDate);
    const numberOfDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    return numberOfDays * pricePerNight;
  }

  // Confirm 버튼 클릭 시 예약 요약 표시
  document.getElementById("confirm").addEventListener("click", () => {
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
    // Confirm 버튼 클릭 후 Clear 버튼을 숨김
    document.getElementById("clear").style.display = "none";
    document.getElementById("confirm").style.display = "none";
  });
  // Clear 버튼 클릭 시 예약 정보 초기화
  document.getElementById("clear").addEventListener("click", () => {
    // Booking details 초기화
    document.getElementById("selected-lodge").textContent = "N/A";
    document.getElementById("capacity-adults").textContent = "Adults: ";
    document.getElementById("capacity-children").textContent = "| Children: ";
    document.getElementById("selected-checkin").textContent = "N/A";
    document.getElementById("selected-checkout").textContent = "N/A";
    document.getElementById("price-per-night").textContent = "$0";
    document.getElementById("total-price").textContent = "$0";
  });
  // Confirm 버튼을 누르기 전까지 Clear 버튼을 다시 활성화
  document.getElementById("clear").style.display = "inline-block";
});
