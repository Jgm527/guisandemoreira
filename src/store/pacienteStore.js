import { defineStore } from "pinia";

// defineStore crea un almacen global reutilizable desde distintos componentes.
// El primer argumento es su identificador unico; el segundo define estado y acciones.
export const usepacienteStore = defineStore("paciente", {
  // El estado contiene los datos del paciente seleccionado y puede consultarse
  // desde cualquier componente que use usepacienteStore().
  state: () => ({
    pacientes: [],
    idPaciente: null,
    dnipac: null,
    nomepac: null,
    apelpac: null,
  }),
  // Las acciones son funciones que modifican el estado compartido.
  actions: {
    // Copia al store los campos usados por las pantallas que dependen del paciente.
    seleccionarPaciente(paciente) {
      this.idPaciente = paciente._id ?? null;
      this.dnipac = paciente.dnipac;
      this.nomepac = paciente.nomepac;
      this.apelpac = paciente.apelpac;
    },
    // Limpia la seleccion cuando ya no debe quedar un paciente activo.
    limpiarPaciente() {
      this.idPaciente = null;
      this.dnipac = null;
      this.nomepac = null;
      this.apelpac = null;
    },
  },
});