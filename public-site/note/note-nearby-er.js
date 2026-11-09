/* ApuDa 암환자 노트: 주변 응급실 안내.
 * No GPS request until a user taps the location button.
 * No coordinates or medical records are stored or sent to ApuDa.
 * Official E-Gen provides the emergency-care status; map searches are candidates only.
 */
(function () {
  'use strict';
  var findButton = document.getElementById('nearbyErFind');
  var status = document.getElementById('nearbyErStatus');
  var mapLink = document.getElementById('nearbyErMapLink');
  var areaForm = document.getElementById('nearbyErAreaForm');
  var areaInput = document.getElementById('nearbyErArea');
  if (!findButton || !status || !mapLink || !areaForm || !areaInput) return;

  function mapUrl(search) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(search);
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('nearby-er-error', !!isError);
  }

  function offerMap(query, text) {
    mapLink.href = mapUrl(query);
    mapLink.textContent = text;
    mapLink.hidden = false;
  }

  function open() {
    if (typeof window.openSheet === 'function') window.openSheet('nearer');
    else document.getElementById('sh-nearer').classList.add('open');
    findButton.disabled = false;
  }

  window.ApudaNearbyER = { open: open };

  findButton.addEventListener('click', function () {
    mapLink.hidden = true;
    if (!navigator.geolocation || !window.isSecureContext) {
      setStatus('이 브라우저에서는 현재 위치를 확인할 수 없어요. 아래에서 지역명을 입력하거나 공식 E-Gen을 이용해 주세요.', true);
      return;
    }
    findButton.disabled = true;
    setStatus('위치 사용 허용 여부를 확인하는 중입니다. 실제 응급상황이라면 기다리지 말고 119에 전화하세요.', false);
    navigator.geolocation.getCurrentPosition(function (position) {
      findButton.disabled = false;
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        setStatus('위치 정보를 확인하지 못했어요. 지역명으로 검색해 주세요.', true);
        return;
      }
      // Round to about 100 m before offering coordinates to an external map.
      var query = '응급실 ' + lat.toFixed(3) + ',' + lng.toFixed(3);
      offerMap(query, '📍 현재 위치 주변 응급실 지도 열기');
      setStatus('위치 확인 완료. 지도 버튼을 누르면 위치를 반영한 검색어가 외부 지도에 전달됩니다. 방문 가능 여부는 119 또는 병원·E-Gen에서 확인하세요.', false);
    }, function (error) {
      findButton.disabled = false;
      var msg = error && error.code === 1 ? '위치 권한을 허용하지 않으셨어요.' : '현재 위치를 확인하지 못했어요.';
      setStatus(msg + ' 아래에서 지역명으로 검색하거나 E-Gen을 이용해 주세요.', true);
    }, { enableHighAccuracy: false, timeout: 9000, maximumAge: 120000 });
  });

  areaForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var area = areaInput.value.trim().replace(/\s+/g, ' ');
    if (area.length < 2 || area.length > 60) {
      setStatus('시·군·구 또는 동 이름을 2~60자 이내로 입력해 주세요. 예: 서초구 반포동', true);
      mapLink.hidden = true;
      return;
    }
    offerMap('응급실 ' + area, '🗺️ ' + area + ' 주변 응급실 지도 열기');
    setStatus('지도 결과는 검색 후보입니다. 진료 가능 여부와 이송 판단은 119 또는 의료기관에서 확인하세요.', false);
  });
})();
