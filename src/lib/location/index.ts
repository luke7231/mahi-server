import axios from "axios";

export const getCoordsFromAddress = async ({ query }) => {
  const url = "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode";

  try {
    const response = await axios.get(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": process.env.NAVER_CLIENT_ID,
        "X-NCP-APIGW-API-KEY": process.env.NAVER_CLIENT_SECRET,
      },
      params: {
        query: query,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error; // 에러 발생 시 에러를 던집니다.
  }
};

export const getAddressFromCoords = async ({ lngInput, latInput }) => {
  const url = "https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc";
  const coords = `${lngInput},${latInput}`; // 좌표 객체를 문자열로 변환
  const params = {
    request: "coordsToaddr",
    coords: coords,
    sourcecrs: "epsg:4326",
    output: "json",
    orders: "roadaddr,legalcode",
  };
  //   console.log(lat, lng);
  try {
    const response = await axios.get(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": process.env.NAVER_CLIENT_ID,
        "X-NCP-APIGW-API-KEY": process.env.NAVER_CLIENT_SECRET,
      },
      params: params,
    });
    // throw new Error("just");
    return response.data;
  } catch (error) {
    throw new Error(error);
  }
};
