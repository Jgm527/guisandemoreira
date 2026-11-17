import { defineStore } from "pinia";

// Guarda en Pinia el doctor elegido en la pestaña de doctores para reutilizarlo en citas.
export const useDoctorStore = defineStore("doctor", {
  state: () => ({
    idDoctor: null,
    nomedoc: null,
    apeldoc: null,
    espedoc: null,
  }),
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
