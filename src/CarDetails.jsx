import React, { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const carDetails = {
  creta: {
    brand: "Hyundai",
    bestFor: "Family trips and longer paved-road journeys",
    overview:
      "A five-seat SUV option for travellers who prefer an elevated seating position. Compare its automatic transmission and daily rate with the smaller Venue before choosing your rental.",
    note: "Plan luggage space around the number of passengers. Check the exact vehicle and included equipment before pickup.",
    photos: [
      "Front three-quarter view",
      "Side profile",
      "Front view",
      "Rear view",
    ],
    source: "https://meromoto.com/new-cars/2024-hyundai-creta-84d99bd",
  },
  swift: {
    brand: "Suzuki",
    bestFor: "City visits and trips with light luggage",
    overview:
      "A compact hatchback with the lowest daily rate in this sample fleet. Its smaller body makes it a practical option when parking space and rental budget are priorities.",
    note: "This rental configuration has a manual gearbox. Consider passenger and luggage space together when planning a longer trip.",
    photos: [
      "Front three-quarter view",
      "Exterior view",
      "Front and side view",
      "Rear view / colour example",
    ],
    source: "https://meromoto.com/new-cars/maruti-suzuki-swift-2d889ff",
  },
  scorpio: {
    brand: "Mahindra",
    bestFor: "Larger groups travelling on suitable paved routes",
    overview:
      "The seven-seat option in this sample fleet. Choose it when passenger capacity matters more than a compact footprint. This rental configuration uses diesel and a manual transmission.",
    note: "Using every seat leaves less room for luggage. This booking does not include off-road permission or a driver service.",
    photos: [
      "Front view",
      "Front and side view",
      "Side and rear view",
      "Rear view",
    ],
    source:
      "https://meromoto.com/used-cars/mahindra-scorpio-s4%2B-2016-87dec31",
  },
  nexon: {
    brand: "Tata",
    bestFor: "City travel and routes with planned charging stops",
    overview:
      "An electric option with an automatic driving setup. Compare its daily rental rate with the petrol cars and plan charging stops before starting a longer journey.",
    note: "Charging costs are not included. Driving range depends on battery condition, road, weather and load; no specific range is guaranteed here.",
    photos: [
      "Front three-quarter view",
      "Side profile",
      "Front view",
      "Rear view",
    ],
    source: "https://meromoto.com/new-cars/tata-nexon-ev-b7faa82",
  },
  city: {
    brand: "Honda",
    bestFor: "Business travel and paved-road trips",
    overview:
      "A five-seat sedan option with an automatic transmission in the sample rental fleet. Consider it for a car-shaped alternative to an SUV when comparing comfort, size and daily price.",
    note: "Check the road surface and access to your destination before choosing a sedan. The photographed model variant may differ from the rental example.",
    photos: [
      "Front three-quarter view",
      "Front view",
      "Side profile",
      "Exterior view",
    ],
    source: "https://meromoto.com/listing/honda-city-5th-generation-9ff14b9",
  },
  venue: {
    brand: "Hyundai",
    bestFor: "City driving and short getaways",
    overview:
      "A compact SUV option priced below the Creta in this fleet. The sample rental has five seats, a petrol engine and a manual gearbox, offering another choice for a small group.",
    note: "Compare seating and luggage needs before booking. Confirm the exact variant and features when arranging pickup.",
    photos: [
      "Front three-quarter view",
      "Exterior view",
      "Side profile",
      "Front view",
    ],
    source: "https://meromoto.com/new-cars/hyundai-venue-b42ab77",
  },
};
const photoUrl = (id, index) =>
  `${import.meta.env.BASE_URL}cars/${id}${index ? "-" + (index + 1) : ""}.webp`;

export default function CarDetails({ car }) {
  const [index, setIndex] = useState(0);
  const info = carDetails[car.id];
  const move = (step) =>
    setIndex(
      (current) => (current + step + info.photos.length) % info.photos.length,
    );
  return (
    <>
      <div
        className="car-gallery"
        role="region"
        aria-label={`${car.name} photo gallery`}
      >
        <img
          className="gallery-main"
          src={photoUrl(car.id, index)}
          alt={`${car.name} - ${info.photos[index]}`}
        />
        <div className="gallery-controls">
          <button
            type="button"
            className="icon-button"
            aria-label="Previous car photo"
            onClick={() => move(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <span aria-live="polite">
            {index + 1} / {info.photos.length} · {info.photos[index]}
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label="Next car photo"
            onClick={() => move(1)}
          >
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="gallery-thumbnails">
          {info.photos.map((label, i) => (
            <button
              type="button"
              key={label}
              aria-label={`Show car photo ${i + 1}: ${label}`}
              aria-pressed={i === index}
              className={i === index ? "active" : ""}
              onClick={() => setIndex(i)}
            >
              <img src={photoUrl(car.id, i)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      </div>
      <p className="vehicle-use">
        <strong>Suitable for</strong>
        {info.bestFor}
      </p>
      <dl className="vehicle-specifications">
        {[
          ["Brand", info.brand],
          ["Body type", car.category],
          ["Seats", `${car.seats} passengers`],
          ["Transmission", car.transmission],
          ["Fuel", car.fuel],
          [
            "Daily rental",
            `NPR ${new Intl.NumberFormat("en-NP").format(car.price)}`,
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <details className="vehicle-more">
        <summary>More about this car</summary>
        <p>{info.overview}</p>
        <p>{info.note}</p>
        <p>
          Rental period: 1–30 days. Pickup and return in the same city. Cancel
          before the pickup date. No online payment is collected.
        </p>
        <p className="vehicle-source">
          Sample rental configuration; model year and equipment may vary.{" "}
          <a href={info.source} target="_blank" rel="noreferrer">
            View model photos on Meromoto
          </a>
          .
        </p>
      </details>
    </>
  );
}
