// 구역 클릭 시 정보 업데이트
const zones = document.querySelectorAll(".zone-btn");
zones.forEach((zone) => {
  zone.addEventListener("click", () => {
    const selectedLodge = zone.getAttribute("data-zone");
    const capacityAdults = zone.getAttribute("data-capacity-adults");
    const capacityChildren = zone.getAttribute("data-capacity-children");
    const price = parseFloat(zone.getAttribute("data-price")); // 가격을 숫자로 변환

    const checkin = document.getElementById("checkin").value;
    const checkout = document.getElementById("checkout").value;
    const adults = document.getElementById("adults").value;
    const children = document.getElementById("children").value;

    // 예약 정보 업데이트
    document.getElementById("selected-lodge").textContent = selectedLodge;
    document.getElementById(
      "capacity-adults"
    ).textContent = `${capacityAdults} adults | ${capacityChildren} children`;
    document.getElementById("selected-checkin").textContent = checkin
      ? checkin
      : "N/A";
    document.getElementById("selected-checkout").textContent = checkout
      ? checkout
      : "N/A";
    document.getElementById("price-per-night").textContent = `$${price}`;

    // 날짜를 이용해 총 가격 계산
    if (checkin && checkout && !isNaN(price)) {
      const totalPrice = calculateTotalPrice(checkin, checkout, price);
      document.getElementById("total-price").textContent = `$${totalPrice}`;
    } else {
      document.getElementById("total-price").textContent = "$0";
    }
  });
});

// 가격 계산 함수
function calculateTotalPrice(checkin, checkout, pricePerNight) {
  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  const timeDifference = Math.abs(checkoutDate - checkinDate);
  const numberOfDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

  // 총 가격 계산
  return numberOfDays * pricePerNight;
}

// Search 버튼 클릭 시 예약 가능 여부를 확인
document.getElementById("search").addEventListener("click", () => {
  const checkin = document.getElementById("checkin").value;
  const checkout = document.getElementById("checkout").value;
  const adults = parseInt(document.getElementById("adults").value, 10);
  const children = parseInt(document.getElementById("children").value, 10);
  const totalPeople = adults + children;

  // 조건에 따라 예약 가능 여부를 설정
  zones.forEach((zone) => {
    const capacityTotal = parseInt(
      zone.getAttribute("data-capacity-total"),
      10
    );

    console.log(
      `Zone: ${zone.getAttribute(
        "data-zone"
      )}, Capacity: ${capacityTotal}, Total People: ${totalPeople}`
    );

    // 총 인원이 구역의 최대 수용 인원보다 크면 예약 불가
    if (totalPeople <= capacityTotal) {
      console.log("Available");
      zone.setAttribute("data-available", "true");
    } else {
      console.log("Not available");
      zone.setAttribute("data-available", "false");
    }
  });

  // 구역 색상 업데이트
  updateZoneAvailability();
});

// 예약 가능한지 여부 설정
function updateZoneAvailability() {
  zones.forEach((zone) => {
    const available = zone.getAttribute("data-available");
    if (available === "false") {
      zone.style.backgroundColor = "rgba(255, 0, 0, 0.7)"; // 예약 불가 시 진홍색 배경
    } else {
      zone.style.backgroundColor = "rgba(0, 255, 0, 0.7)"; // 예약 가능 시 연두색 배경
    }
  });
}

// 페이지 로드 시 예약 가능 여부 업데이트
updateZoneAvailability();

// 예약 완료 처리
document.getElementById("confirm").addEventListener("click", () => {
  const selectedLodge = document.getElementById("selected-lodge").textContent;

  // 선택된 구역을 찾고, 예약 완료 처리
  zones.forEach((zone) => {
    if (zone.getAttribute("data-zone") === selectedLodge) {
      zone.setAttribute("data-available", "false"); // 예약 완료
      zone.style.backgroundColor = "rgba(255, 0, 0, 0.7)"; // 예약 완료 색상
      zone.disabled = true; // 버튼 비활성화
    }
  });

  // 예약 완료 메시지 출력
  alert(`${selectedLodge} 예약이 완료되었습니다.`);
});

// 예약 정보 초기화
document.getElementById("clear").addEventListener("click", () => {
  // 입력 필드 초기화
  document.getElementById("checkin").value = "";
  document.getElementById("checkout").value = "";
  document.getElementById("adults").value = 1;
  document.getElementById("children").value = 0;

  // 선택된 구역 정보 초기화
  document.getElementById("selected-lodge").textContent = "N/A";
  document.getElementById("capacity-adults").textContent = "0";
  document.getElementById("capacity-children").textContent = "0";
  document.getElementById("price-per-night").textContent = "$0";
  document.getElementById("total-price").textContent = "$0";

  // 구역 색상 및 상태 초기화
  zones.forEach((zone) => {
    if (zone.getAttribute("data-available") === "true") {
      zone.style.backgroundColor = "rgba(0, 255, 0, 0.7)"; // 예약 가능 색상
      zone.disabled = false; // 다시 활성화
    }
  });
});

// 예약 상태 저장 함수 (로컬 저장소에 저장)
function saveReservationStatus() {
  const reservationStatus = [];
  zones.forEach((zone) => {
    reservationStatus.push({
      zone: zone.getAttribute("data-zone"),
      available: zone.getAttribute("data-available"),
    });
  });
  localStorage.setItem("reservationStatus", JSON.stringify(reservationStatus));
}

// 페이지 로드 시 저장된 예약 상태 불러오기
function loadReservationStatus() {
  const savedStatus = localStorage.getItem("reservationStatus");
  if (savedStatus) {
    const reservationStatus = JSON.parse(savedStatus);
    reservationStatus.forEach((status) => {
      const zone = document.querySelector(`[data-zone="${status.zone}"]`);
      zone.setAttribute("data-available", status.available);
      if (status.available === "false") {
        zone.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
        zone.disabled = true;
      } else {
        zone.style.backgroundColor = "rgba(0, 255, 0, 0.7)";
        zone.disabled = false;
      }
    });
  }
}

// 예약 완료 시 상태 저장
document.getElementById("confirm").addEventListener("click", () => {
  saveReservationStatus();
});

// 페이지 로드 시 상태 불러오기
document.addEventListener("DOMContentLoaded", loadReservationStatus);

// 가격 계산 함수
function calculateTotalPrice(checkin, checkout, pricePerNight) {
  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  const timeDifference = Math.abs(checkoutDate - checkinDate);
  const numberOfDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

  // 총 가격 계산
  return numberOfDays * pricePerNight;
}

// 예약 정보 업데이트 후 가격 계산
document.getElementById("confirm").addEventListener("click", () => {
  calculateTotalPrice();
});

// Search 버튼 클릭 시 예약 제한 적용
document.getElementById("search").addEventListener("click", () => {
  const adults = parseInt(document.getElementById("adults").value, 10);
  const children = parseInt(document.getElementById("children").value, 10);
  const totalPeople = adults + children;

  zones.forEach((zone) => {
    const capacityTotal = parseInt(
      zone.getAttribute("data-capacity-total"),
      10
    );

    if (totalPeople > capacityTotal) {
      zone.setAttribute("data-available", "false");
    }
  });

  updateZoneAvailability();
});

// 구역 상태에 따른 색상 업데이트
function updateZoneAvailability() {
  zones.forEach((zone) => {
    const available = zone.getAttribute("data-available");
    if (available === "false") {
      zone.style.backgroundColor = "rgba(255, 0, 0, 0.7)"; // 예약 불가 시 진홍색
    } else {
      zone.style.backgroundColor = "rgba(0, 255, 0, 0.7)"; // 예약 가능 시 연두색
    }
  });
}
