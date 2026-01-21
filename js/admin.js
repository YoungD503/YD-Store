// admin.js
import { db, collection, addDoc } from "./firebase.js";

const nameEl = document.getElementById("prodName");
const priceEl = document.getElementById("prodPrice");
const imgEl = document.getElementById("prodImage");
const descEl = document.getElementById("prodDesc");
const addBtn = document.getElementById("addProductBtn");

addBtn.addEventListener("click", async () => {
  const name = nameEl.value.trim();
  const price = Number(priceEl.value);
  const imageUrl = imgEl.value.trim();
  const description = descEl.value.trim();

  if (!name || !price) {
    alert("Name and price are required.");
    return;
  }
  try {
    await addDoc(collection(db, "products"), {
      name,
      price,
      imageUrl,
      description,
    });
    alert("Product added!");
    nameEl.value = "";
    priceEl.value = "";
    imgEl.value = "";
    descEl.value = "";
  } catch (err) {
    alert(err.message);
  }
});
