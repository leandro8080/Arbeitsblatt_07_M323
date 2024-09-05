import hh from "hyperscript-helpers";
import { h, diff, patch } from "virtual-dom";
import createElement from "virtual-dom/create-element";

const { div, button, input, table, tr, th, td, section } = hh(h);

const APPID = "Put here key"; //Don't forget to put the key
const baseAPIUrl = "http://api.openweathermap.org/data/2.5/weather";

const messages = {
  addLocation: "ADD_LOCATION",
  deleteLocation: "DELETE_LOCATION",
  updateLocationName: "UPDATE_LOCATON_NAME",
};

function view(dispatch, model, getTemp) {
  return div({ className: "flex flex-col gap-4 items-center" }, [
    section({ className: "w-full flex h-10 gap-5" }, [
      input({
        className: "w-full border p-2 rounded-md",
        placeholder: "Enter location",
        oninput: (e) => dispatch(messages.updateLocationName, e.target.value),
        value: model.currentLocation.name,
      }),

      button(
        {
          className: "bg-green-500 px-3 py-1 rounded-md text-white w-40",
          onclick: () => getTemp(model.currentLocation.name, dispatch),
        },
        "Add location"
      ),
    ]),
    table({ className: "w-full mt-4 border border-gray-300" }, [
      tr([
        th({ className: "text-left font-semibold border" }, "Location"),
        th({ className: "text-left font-semibold border" }, "Temp"),
        th({ className: "text-left font-semibold border" }, "Low"),
        th({ className: "text-left font-semibold border" }, "High"),
        th({ className: "text-left font-semibold border" }, ""),
      ]),
      ...model.locations.map((location, index) =>
        tr({ key: index }, [
          td([location.name]),
          td([location.temp]),
          td([location.low]),
          td([location.high]),
          td([
            button(
              {
                className: "text-red-500",
                onclick: () => dispatch(messages.deleteLocation, index),
              },
              "🗑"
            ),
          ]),
        ])
      ),
    ]),
  ]);
}

function update(message, model, value) {
  switch (message) {
    case messages.updateLocationName:
      return {
        ...model,
        currentLocation: { ...model.currentLocation, name: value },
      };

    case messages.addLocation: {
      const newLocation = { ...model.currentLocation, temp: value.temp, low: value.low, high: value.high };
      const locations = [...model.locations, newLocation];
      return {
        ...model,
        locations,
        currentLocation: { name: "" },
      };
    }

    case messages.deleteLocation: {
      const locations = model.locations.filter((_, index) => index !== value);
      return { ...model, locations };
    }

    default:
      return model;
  }
}

// IMPURER code below
function app(initialModel, update, view, node) {
  let model = initialModel;
  let currentView = view(dispatch, model, getTemp);
  let rootNode = createElement(currentView);
  node.appendChild(rootNode);

  function dispatch(message, value) {
    model = update(message, model, value);
    const updatedView = view(dispatch, model, getTemp);
    const patches = diff(currentView, updatedView);
    rootNode = patch(rootNode, patches);
    currentView = updatedView;
  }
}

async function getTemp(location, dispatch) {
  try {
    const apiUrl = `${baseAPIUrl}?q=${encodeURI(location)}&units=metric&APPID=${APPID}`;
    const response = await fetch(apiUrl);
    if (response.status === 200) {
      const body = await response.json();
      const temperatures = { temp: body.main.temp, low: body.main.temp_min, high: body.main.temp_max };
      dispatch(messages.addLocation, temperatures);
    } else {
      const temperatures = { temp: "No value", low: "No value", high: "No value" };
      dispatch(messages.addLocation, temperatures);
    }
  } catch (error) {
    const temperatures = { temp: "No value", low: "No value", high: "No value" };
    dispatch(messages.addLocation, temperatures);
  }
}
const initialModel = {
  locations: [],
  currentLocation: { name: "" },
};

const rootNode = document.getElementById("app");
app(initialModel, update, view, rootNode);
