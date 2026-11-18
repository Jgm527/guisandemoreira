import { defineStore } from "pinia";

// Guarda en Pinia el doctor elegido en la pestaña de doctores para reutilizarlo en citas.
// Este store solo guarda la seleccion actual: no es una copia de la base de datos y se
// pierde al recargar la pagina. Para persistir hay que programar la persistencia de Pinia.
export const useDoctorStore = defineStore("doctor", {
  // Estado compartido: el identificador real de MongoDB y los campos que muestran
  // las pantallas sin tener que volver a pedir el doctor a la API.
  state: () => ({
    idDoctor: null,
    nomedoc: null,
    apeldoc: null,
    espedoc: null,
  }),
  // Una accion por operacion posible sobre la seleccion; asi ningun componente
  // escribe el estado del store a mano.
  actions: {
    seleccionarDoctor(doctor) {
      this.idDoctor = doctor._id ?? null;
      this.nomedoc = doctor.nomedoc;
      this.apeldoc = doctor.apeldoc;
      this.espedoc = doctor.espedoc;
    },
    limpiarDoctor() {
      this.idDoctor = null;
      this.nomedoc = null;
      this.apeldoc = null;
      this.espedoc = null;
    },
  },
});
