![COINPLANET](https://velog.velcdn.com/images/2pandi/post/8e271e45-8305-4066-94f4-ca786d977933/image.png)

<br>

## ❓ COIN PLANET 이란

- **COIN PLANET**은 **<u>코인 분할매수 분할매도 자동매매 프로그램</u>** 입니다.
- 같은 코인의 거래를 1차수 부터 N차수 까지 서로 다른 코인으로 가정하고 거래하는 방식으로 단순한 물타기 방식의 매매가 아닌 각각의 차수 매매를 통해 원금을 늘려가는 자동매매 프로그램 입니다.
- 해당 자동매매 프로그램이 수익을 보장하지는 않습니다.

### 코인플래닛 테스트

---

테스트 기간 : 06/19 ~ 09/25 (14주)

해당 기간 코인(BTC) 가격<br>
06/19 : 9,200만원 <br>
09/19 : 8,500만원

**총 실현손익 (실제 팔아서 번 돈) : +95만원**<br>
시드 : 400만원 ~ 800만원까지 유동적으로 변경

---

- **_모든 투자의 책임은 본인에게 있습니다_.**

---

- 해당 프로젝트는 사이드 프로젝트로 어떤 금전적인 이득을 얻기 위함이 아닙니다.
- **해당 코드를 살펴보고 직접 거래에 이용하는 것은 자유지만 투자에 대해 프로그램 개발자는 어떠한 책임도 지지 않습니다.**
- 해당 프로젝트는 업비트 Open api를 이용합니다. 만약 **업비트 서버의 문제로 인해 투자 손실이나 불이익을 얻게 되어도 프로그램 개발자는 어떠한 책임도 지지 않습니다.**

---

- **_모든 투자의 책임은 본인에게 있습니다_**.

---

<br>

## 🖥️ COIN PLANET 페이지

### 메인(종목 별 손익 조회) 페이지

![메인페이지](https://velog.velcdn.com/images/2pandi/post/06ee2ee2-99b2-4367-bbba-a5e7bf16dfdf/image.png)

### API 키 등록 페이지

![키등록페이지](https://velog.velcdn.com/images/2pandi/post/50cabef5-a82f-4dda-9246-d64b0cecab9f/image.png)

### 주문하기 페이지

![주문하기페이지](https://velog.velcdn.com/images/2pandi/post/97a3119b-fd1e-41cc-b5eb-201edaf63229/image.png)

<br>

## 🛠 사용 방법

1. [🛠 COIN PLANET 사용 방법](링크)
   - [다운로드 및 설치](https://helpful-pincushion-92b.notion.site/COIN-PLANET-5f447d3e7f304200b7ed5f36e07e4c35?pvs=4)
   - [키 등록](https://helpful-pincushion-92b.notion.site/Open-API-Key-82262ebc36c5435bb3ccbfd33091a19e?pvs=4)
   - [매매 등록](https://helpful-pincushion-92b.notion.site/ec04fdccbab1414fba7c0f3b88956cb1?pvs=4)
   - [매매 기록 확인](https://helpful-pincushion-92b.notion.site/f1b4f0785e804992bbe73788e9e2a6cd?pvs=4)

<br>

## ⚒️ 기술스택

![electron](https://velog.velcdn.com/images/wndud2274/post/d08e3dfe-8f39-4c81-b980-930c740460f0/image.png)

### 사용 이유

- 이번 프로젝트는 일렉트론을 사용해 데스크탑 애플리케이션으로 개발했습니다. 초기 기획 단계에서는 웹서비스 + 서버로 구성하려고 했지만 해당 프로젝트는 실제 자산 거래가 이뤄지기 때문에 보안적인 측면에서 데스크탑 애플리케이션 개발로 결정했습니다.

- (업비트 api 관련 문서 링크와 이유 설명)

<br>

## 🚀 업데이트 이력

<details><summary>0.1.0</summary>

- 차수별 자동매매
- 5차수 고정
- 비트코인, 이더리움, 리플만 가능
- 현재 맥북에서만 실행 가능

</details>

<details><summary>0.1.2</summary>

- dmg 파일 릴리즈
- 기타 버그 수정

</details>

<details><summary>0.2.0</summary>

- 매수/매도 퍼센트 입력 기능 추가
- 자동감시주문 주기 10초 -> 1초로 수정
- 기타 버그 수정

</details>
