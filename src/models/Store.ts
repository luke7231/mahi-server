import { Schema, model } from "mongoose";

const storeSchema = new Schema({
  lng: Number,
  lat: Number,
  title: String,
});

export default model("Store", storeSchema);
