/* Kakao API Everything — 테스트 플레이그라운드 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var out = function (id, data) {
    $(id).textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  };
  var map = null, mapMarkers = [], mapReady = false;

  /* ---------- 탭 ---------- */
  document.querySelectorAll(".tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (b) { b.classList.remove("active"); });
      document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      $("panel-" + btn.dataset.tab).classList.add("active");
      if (btn.dataset.tab === "map" && map) {
        setTimeout(function () { map.relayout(); }, 50);
      }
    });
  });

  /* ---------- 설정 ---------- */
  $("curOrigin").textContent = location.origin;
  $("jsKey").value = localStorage.getItem("kakao_js_key") || "";
  $("mapKey").value = localStorage.getItem("kakao_map_key") || "";

  function setStatus(msg, ok) {
    var el = $("initStatus");
    el.textContent = msg;
    el.className = "status " + (ok ? "ok" : "err");
  }

  function initSdk() {
    var jsKey = $("jsKey").value.trim();
    var mapKey = $("mapKey").value.trim() || jsKey;
    if (!jsKey) { setStatus("JavaScript 키를 입력하세요.", false); return; }
    localStorage.setItem("kakao_js_key", jsKey);
    localStorage.setItem("kakao_map_key", mapKey);
    try {
      if (window.Kakao) {
        if (Kakao.isInitialized()) Kakao.cleanup();
        Kakao.init(jsKey);
        setStatus("✅ Kakao JS SDK 초기화 완료 (v" + Kakao.VERSION + ")", true);
      }
    } catch (e) {
      setStatus("초기화 실패: " + e.message, false);
      return;
    }
    loadMapSdk(mapKey);
  }

  function loadMapSdk(mapKey) {
    if (mapReady) { return; }
    var s = document.createElement("script");
    s.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=" + encodeURIComponent(mapKey) +
            "&libraries=services&autoload=false";
    s.onload = function () {
      kakao.maps.load(function () {
        mapReady = true;
        map = new kakao.maps.Map($("mapContainer"), {
          center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울시청
          level: 4
        });
        out("mapOut", "✅ 지도 SDK 로드 완료. 검색/마커 기능을 사용할 수 있습니다.");
      });
    };
    s.onerror = function () {
      out("mapOut", "❌ 지도 SDK 로드 실패. 앱 키와 플랫폼 Web 도메인 등록(" + location.origin + ")을 확인하세요.");
    };
    document.head.appendChild(s);
  }

  $("btnInit").addEventListener("click", initSdk);
  $("btnClearKeys").addEventListener("click", function () {
    localStorage.removeItem("kakao_js_key");
    localStorage.removeItem("kakao_map_key");
    $("jsKey").value = ""; $("mapKey").value = "";
    setStatus("저장된 키를 삭제했습니다.", true);
  });
  // 저장된 키가 있으면 자동 초기화
  if ($("jsKey").value) initSdk();

  function requireSdk(outId) {
    if (!window.Kakao || !Kakao.isInitialized()) {
      out(outId, "⚠️ 먼저 설정 탭에서 SDK를 초기화하세요.");
      return false;
    }
    return true;
  }

  /* ---------- 로그인 ---------- */
  $("btnLogin").addEventListener("click", function () {
    if (!requireSdk("loginOut")) return;
    // JS SDK v2: 팝업 로그인은 authorize(리다이렉트) 권장이지만 테스트 편의상 현재 페이지로 복귀
    Kakao.Auth.authorize({ redirectUri: location.origin + location.pathname });
  });

  $("btnLoginScope").addEventListener("click", function () {
    if (!requireSdk("loginOut")) return;
    Kakao.Auth.authorize({
      redirectUri: location.origin + location.pathname,
      scope: "account_email"
    });
  });

  // authorize 리다이렉트 복귀 시 code → 안내 (토큰 교환은 서버 필요)
  var authCode = new URLSearchParams(location.search).get("code");
  if (authCode) {
    out("loginOut",
      "✅ 인가 코드 수신:\n" + authCode +
      "\n\n※ JS SDK v2에서는 인가 코드를 토큰으로 교환하려면 서버(REST API)가 필요합니다." +
      "\n간단 테스트는 아래 curl로 가능합니다:\n\n" +
      "curl -X POST https://kauth.kakao.com/oauth/token \\\n" +
      "  -d grant_type=authorization_code \\\n" +
      "  -d client_id=<REST_API_KEY> \\\n" +
      "  -d redirect_uri=" + location.origin + location.pathname + " \\\n" +
      "  -d code=" + authCode +
      "\n\n발급된 access_token은 Kakao.Auth.setAccessToken()으로 설정 후 사용자 정보 조회가 가능합니다." +
      "\n(개발자 도구 콘솔: Kakao.Auth.setAccessToken('토큰값'))");
    // 로그인 탭 자동 이동
    document.querySelector('[data-tab="login"]').click();
  }

  $("btnUserInfo").addEventListener("click", function () {
    if (!requireSdk("loginOut")) return;
    Kakao.API.request({ url: "/v2/user/me" })
      .then(function (res) { out("loginOut", res); })
      .catch(function (err) { out("loginOut", err); });
  });

  $("btnTokenInfo").addEventListener("click", function () {
    if (!requireSdk("loginOut")) return;
    var token = Kakao.Auth.getAccessToken();
    if (!token) { out("loginOut", "액세스 토큰이 없습니다. 로그인 후 토큰을 설정하세요."); return; }
    Kakao.API.request({ url: "/v1/user/access_token_info" })
      .then(function (res) { out("loginOut", res); })
      .catch(function (err) { out("loginOut", err); });
  });

  $("btnLogout").addEventListener("click", function () {
    if (!requireSdk("loginOut")) return;
    if (!Kakao.Auth.getAccessToken()) { out("loginOut", "로그인 상태가 아닙니다."); return; }
    Kakao.Auth.logout().then(function () { out("loginOut", "✅ 로그아웃 완료"); });
  });

  $("btnUnlink").addEventListener("click", function () {
    if (!requireSdk("loginOut")) return;
    Kakao.API.request({ url: "/v1/user/unlink" })
      .then(function (res) { out("loginOut", { message: "✅ 연결 끊기 완료", result: res }); })
      .catch(function (err) { out("loginOut", err); });
  });

  /* ---------- 카카오톡 공유 ---------- */
  var SAMPLE_IMG = "https://mud-kage.kakao.com/dn/NTmhS/btqfEUdFAUf/FjKzkZsnoeE4o19klTOVI1/openlink_640x640s.jpg";
  var HERE = location.href.split("?")[0];
  var link = { mobileWebUrl: HERE, webUrl: HERE };

  var shareTemplates = {
    feed: {
      objectType: "feed",
      content: {
        title: "Feed 템플릿 테스트",
        description: "Kakao API Everything에서 보낸 공유 메시지입니다.",
        imageUrl: SAMPLE_IMG,
        link: link
      },
      social: { likeCount: 100, commentCount: 200, sharedCount: 300 },
      buttons: [{ title: "웹으로 보기", link: link }]
    },
    list: {
      objectType: "list",
      headerTitle: "List 템플릿 테스트",
      headerLink: link,
      contents: [
        { title: "항목 1", description: "첫 번째 항목", imageUrl: SAMPLE_IMG, link: link },
        { title: "항목 2", description: "두 번째 항목", imageUrl: SAMPLE_IMG, link: link },
        { title: "항목 3", description: "세 번째 항목", imageUrl: SAMPLE_IMG, link: link }
      ],
      buttons: [{ title: "웹으로 보기", link: link }]
    },
    location: {
      objectType: "location",
      address: "경기 성남시 분당구 판교역로 235",
      addressTitle: "카카오 판교아지트",
      content: {
        title: "Location 템플릿 테스트",
        description: "주소가 첨부된 공유 메시지",
        imageUrl: SAMPLE_IMG,
        link: link
      }
    },
    commerce: {
      objectType: "commerce",
      content: {
        title: "Commerce 템플릿 테스트",
        imageUrl: SAMPLE_IMG,
        link: link
      },
      commerce: { regularPrice: 50000, discountPrice: 35000, discountRate: 30 },
      buttons: [{ title: "구매하기", link: link }]
    },
    text: {
      objectType: "text",
      text: "Text 템플릿 테스트 — Kakao API Everything 플레이그라운드에서 전송한 텍스트 메시지입니다.",
      link: link
    }
  };

  document.querySelectorAll("[data-share]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!requireSdk("shareOut")) return;
      var type = btn.dataset.share;
      try {
        Kakao.Share.sendDefault(shareTemplates[type]);
        out("shareOut", "✅ " + type + " 템플릿 공유 창을 호출했습니다.\n\n전송한 템플릿:\n" +
          JSON.stringify(shareTemplates[type], null, 2));
      } catch (e) {
        out("shareOut", "❌ 공유 실패: " + e.message);
      }
    });
  });

  /* ---------- 지도 ---------- */
  function requireMap() {
    if (!mapReady) { out("mapOut", "⚠️ 먼저 설정 탭에서 SDK를 초기화하세요."); return false; }
    return true;
  }
  function clearMarkers() {
    mapMarkers.forEach(function (m) { m.setMap(null); });
    mapMarkers = [];
  }
  function addMarker(lat, lng, title) {
    var pos = new kakao.maps.LatLng(lat, lng);
    var marker = new kakao.maps.Marker({ map: map, position: pos, title: title || "" });
    mapMarkers.push(marker);
    return pos;
  }

  $("btnKeyword").addEventListener("click", function () {
    if (!requireMap()) return;
    var q = $("kwQuery").value.trim();
    if (!q) { out("mapOut", "검색어를 입력하세요."); return; }
    new kakao.maps.services.Places().keywordSearch(q, function (data, status) {
      if (status !== kakao.maps.services.Status.OK) { out("mapOut", "검색 실패: " + status); return; }
      clearMarkers();
      var bounds = new kakao.maps.LatLngBounds();
      data.forEach(function (p) { bounds.extend(addMarker(p.y, p.x, p.place_name)); });
      map.setBounds(bounds);
      out("mapOut", data.map(function (p, i) {
        return (i + 1) + ". " + p.place_name + " | " + (p.road_address_name || p.address_name) + " | " + (p.phone || "-");
      }).join("\n"));
    });
  });

  $("btnGeocode").addEventListener("click", function () {
    if (!requireMap()) return;
    var q = $("addrQuery").value.trim();
    if (!q) { out("mapOut", "주소를 입력하세요."); return; }
    new kakao.maps.services.Geocoder().addressSearch(q, function (result, status) {
      if (status !== kakao.maps.services.Status.OK || !result.length) {
        out("mapOut", "주소 검색 실패: " + status); return;
      }
      var r = result[0];
      clearMarkers();
      var pos = addMarker(r.y, r.x, r.address_name);
      map.setCenter(pos); map.setLevel(3);
      out("mapOut", r);
    });
  });

  $("btnMarker").addEventListener("click", function () {
    if (!requireMap()) return;
    var c = map.getCenter();
    addMarker(c.getLat(), c.getLng(), "중심 마커");
    out("mapOut", "마커 추가: " + c.getLat().toFixed(6) + ", " + c.getLng().toFixed(6));
  });

  $("btnMyLoc").addEventListener("click", function () {
    if (!requireMap()) return;
    if (!navigator.geolocation) { out("mapOut", "이 브라우저는 Geolocation을 지원하지 않습니다."); return; }
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude, lng = pos.coords.longitude;
      clearMarkers();
      map.setCenter(addMarker(lat, lng, "내 위치"));
      map.setLevel(3);
      out("mapOut", "내 위치: " + lat + ", " + lng);
    }, function (err) {
      out("mapOut", "위치 조회 실패: " + err.message);
    });
  });

  /* ---------- 우편번호 ---------- */
  $("btnPostcode").addEventListener("click", function () {
    var wrap = $("postcodeWrap");
    wrap.style.display = "block";
    new daum.Postcode({
      oncomplete: function (data) {
        wrap.style.display = "none";
        out("postcodeOut", data);
      },
      width: "100%", height: "100%"
    }).embed(wrap);
  });
  $("btnPostcodeClose").addEventListener("click", function () {
    $("postcodeWrap").style.display = "none";
  });

  /* ---------- 채널 ---------- */
  function channelId() {
    var id = $("channelId").value.trim();
    if (!id) { out("channelOut", "채널 공개 ID를 입력하세요. (_로 시작)"); return null; }
    return id;
  }
  $("btnChannelAdd").addEventListener("click", function () {
    if (!requireSdk("channelOut")) return;
    var id = channelId(); if (!id) return;
    Kakao.Channel.followChannel({ channelPublicId: id })
      .then(function (res) { out("channelOut", res); })
      .catch(function (err) { out("channelOut", "채널 추가 호출 결과: " + (err && err.message || err)); });
  });
  $("btnChannelChat").addEventListener("click", function () {
    if (!requireSdk("channelOut")) return;
    var id = channelId(); if (!id) return;
    Kakao.Channel.chat({ channelPublicId: id });
    out("channelOut", "✅ 채널 1:1 채팅 창을 호출했습니다.");
  });

  /* ---------- REST curl 생성기 ---------- */
  var restDefs = {
    "local-keyword": {
      auth: "KakaoAK",
      build: function (p) {
        return "curl -G 'https://dapi.kakao.com/v2/local/search/keyword.json' \\\n" +
               "  --data-urlencode 'query=" + (p || "카카오프렌즈") + "'";
      }
    },
    "local-address": {
      auth: "KakaoAK",
      build: function (p) {
        return "curl -G 'https://dapi.kakao.com/v2/local/search/address.json' \\\n" +
               "  --data-urlencode 'query=" + (p || "전북 삼성동 100") + "'";
      }
    },
    "local-coord2addr": {
      auth: "KakaoAK",
      build: function (p) {
        var xy = (p || "127.423084,37.026109").split(",");
        return "curl -G 'https://dapi.kakao.com/v2/local/geo/coord2address.json' \\\n" +
               "  -d 'x=" + (xy[0] || "").trim() + "' -d 'y=" + (xy[1] || "").trim() + "'";
      }
    },
    "memo": {
      auth: "Bearer",
      build: function (p) {
        var tpl = {
          object_type: "text",
          text: p || "나에게 보내기 테스트 메시지",
          link: { web_url: "https://developers.kakao.com" }
        };
        return "curl -X POST 'https://kapi.kakao.com/v2/api/talk/memo/default/send' \\\n" +
               "  --data-urlencode 'template_object=" + JSON.stringify(tpl) + "'";
      }
    },
    "user-me": {
      auth: "Bearer",
      build: function () { return "curl 'https://kapi.kakao.com/v2/user/me'"; }
    },
    "friends": {
      auth: "Bearer",
      build: function () { return "curl 'https://kapi.kakao.com/v1/api/talk/friends'"; }
    }
  };

  $("btnGenCurl").addEventListener("click", function () {
    var def = restDefs[$("restApi").value];
    var key = $("restKey").value.trim() || "{{" + (def.auth === "KakaoAK" ? "REST_API_KEY" : "ACCESS_TOKEN") + "}}";
    var authHeader = def.auth === "KakaoAK" ? "KakaoAK " + key : "Bearer " + key;
    var cmd = def.build($("restParam").value.trim());
    // Authorization 헤더를 첫 줄 다음에 삽입
    var lines = cmd.split("\n");
    lines[0] += " \\";
    lines.splice(1, 0, "  -H 'Authorization: " + authHeader + "' \\");
    // 마지막 줄 백슬래시 정리
    var text = lines.join("\n").replace(/ \\\n$/, "\n").replace(/ \\$/, "");
    out("restOut", text);
  });

  $("btnCopyCurl").addEventListener("click", function () {
    navigator.clipboard.writeText($("restOut").textContent).then(function () {
      $("btnCopyCurl").textContent = "복사됨!";
      setTimeout(function () { $("btnCopyCurl").textContent = "복사"; }, 1500);
    });
  });
})();
