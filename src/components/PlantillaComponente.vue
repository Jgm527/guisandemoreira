<template>
  <!--
    PLANTILLA / CATALOGO DE ELEMENTOS VUE
    Copia este archivo, renombra "registro" con tu entidad y elimina los
    campos o bloques que tu pantalla no necesite. Los textos entre corchetes
    como [NOMBRE DE LA ENTIDAD] son placeholders para reemplazar.

    Este ejemplo funciona en memoria: no guarda en MongoDB. Cada bloque trae
    comentado el punto exacto donde va la llamada a src/api/ cuando quieras
    persistir los datos.

    INDICE DE BLOQUES
      0. Cabecera y acciones: nuevo, PDF y actualizar
      1. Formulario completo con validaciones y selector en cascada
      2. Barra de filtros: buscador, estado, categoria y rango de fechas
      3. Ficha del registro seleccionado (dl accesible)
      4. Tabla con orden por cabecera, columna calculada y acciones
      5. Paginacion
      6. Estados de carga, error y lista vacia
      7. Formatos reutilizables: fecha, edad, etiquetas y colores
  -->
  <section class="box-border w-full min-w-0 rounded-lg bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] sm:p-8">
    <!-- BLOQUE 0: cabecera con el titulo y las acciones de la pantalla. -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded bg-[#1b4965] px-3 py-2 text-white">
      <h4 class="m-0 font-semibold">
        {{ titulo }}
      </h4>
      <div class="flex flex-wrap gap-2">
        <!-- Vuelve al modo alta y deja el formulario limpio. -->
        <button
          class="rounded border border-white/40 bg-white/10 px-3 py-1 text-sm font-semibold hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          @click="limpiarFormulario"
        >
          [NUEVO]
        </button>
        <!-- Exporta exactamente lo que se ve en la tabla, con los filtros aplicados. -->
        <button
          class="rounded border border-white/40 bg-white/10 px-3 py-1 text-sm font-semibold hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="listaOrdenada.length === 0"
          @click="exportarPDF"
        >
          [PDF]
        </button>
        <!-- En una pantalla conectada, vuelve a pedir la lista al backend. -->
        <button
          class="rounded border border-white/40 bg-white/10 px-3 py-1 text-sm font-semibold hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="cargando"
          @click="cargarRegistros"
        >
          [ACTUALIZAR]
        </button>
      </div>
    </div>

    <!--
      BLOQUE 1: FORMULARIO DE ALTA Y EDICION
      @submit.prevent ejecuta guardarRegistro() sin recargar la pagina.
      registro es el objeto reactive enlazado a los controles con v-model.
    -->
    <form
      class="mb-8 grid gap-4"
      @submit.prevent="guardarRegistro"
    >
      <!-- Campo de texto obligatorio; .trim elimina espacios al guardar el valor. -->
      <div class="grid gap-2">
        <label for="registro-nombre">[NOMBRE DEL CAMPO OBLIGATORIO]</label>
        <input
          id="registro-nombre"
          v-model.trim="registro.nombre"
          class="w-full rounded border border-[var(--color-borde)] p-2"
          type="text"
          required
          maxlength="80"
          placeholder="[Ej.: nombre o titulo]"
          @blur="capitalizarCampo('nombre')"
        >
      </div>

      <!-- DNI con letra de control. Copia este bloque y su funcion validarDni() para
           pacientes; el mensaje solo aparece cuando el campo ya tiene contenido. -->
      <div class="grid gap-2">
        <label for="registro-dni">[DNI CON LETRA]</label>
        <input
          id="registro-dni"
          v-model.trim="registro.dni"
          class="w-full rounded border border-[var(--color-borde)] p-2 uppercase"
          type="text"
          maxlength="9"
          placeholder="[Ej.: 12345678Z]"
          :aria-invalid="dniInvalido"
          :class="{ 'border-2 border-[#e3342f]': dniInvalido }"
        >
        <small
          v-if="dniInvalido"
          class="text-sm text-[#e3342f]"
        >
          [El DNI no es valido: revisa los 8 digitos y la letra.]
        </small>
      </div>

      <!-- Ejemplos de campos de contacto y fecha; quita los que no use tu entidad. -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="grid gap-2">
          <label for="registro-correo">[CORREO OPCIONAL]</label>
          <input
            id="registro-correo"
            v-model.trim="registro.correo"
            class="w-full rounded border border-[var(--color-borde)] p-2"
            type="email"
            placeholder="nombre@ejemplo.com"
            :aria-invalid="mailInvalido"
            :class="{ 'border-2 border-[#e3342f]': mailInvalido }"
            @input="mailTocado = true"
            @blur="sanitizarMail"
          >
          <!-- El mensaje solo aparece cuando el usuario ya toco el campo. -->
          <small
            v-if="mailInvalido"
            class="text-sm text-[#e3342f]"
          >
            [Introduce un correo valido o deja el campo vacio.]
          </small>
        </div>

        <div class="grid gap-2">
          <label for="registro-telefono">[TELEFONO OPCIONAL]</label>
          <input
            id="registro-telefono"
            v-model.trim="registro.telefono"
            class="w-full rounded border border-[var(--color-borde)] p-2"
            type="tel"
            inputmode="numeric"
            pattern="[67][0-9]{8}"
            placeholder="[Ej.: 600123456]"
            :aria-invalid="telefonoInvalido"
            :class="{ 'border-2 border-[#e3342f]': telefonoInvalido }"
            @input="sanitizarTelefono"
            @blur="sanitizarTelefono"
          >
          <small
            v-if="telefonoInvalido"
            class="text-sm text-[#e3342f]"
          >
            [Debe tener 9 digitos y empezar por 6 o 7.]
          </small>
        </div>

        <div class="grid gap-2">
          <label for="registro-fecha">[FECHA OPCIONAL]</label>
          <input
            id="registro-fecha"
            v-model="registro.fecha"
            class="w-full rounded border border-[var(--color-borde)] p-2"
            type="date"
            :min="hoy"
          >
        </div>

        <div class="grid gap-2">
          <label for="registro-hora">[HORA OPCIONAL]</label>
          <input
            id="registro-hora"
            v-model="registro.hora"
            class="w-full rounded border border-[var(--color-borde)] p-2"
            type="time"
          >
        </div>

        <div class="grid gap-2">
          <label for="registro-cantidad">[CANTIDAD O EDAD]</label>
          <input
            id="registro-cantidad"
            v-model.number="registro.cantidad"
            class="w-full rounded border border-[var(--color-borde)] p-2"
            type="number"
            min="0"
            placeholder="[Ej.: 1]"
          >
        </div>

        <div class="grid gap-2">
          <label for="registro-nacimiento">[FECHA DE NACIMIENTO]</label>
          <input
            id="registro-nacimiento"
            v-model="registro.nacimiento"
            class="w-full rounded border border-[var(--color-borde)] p-2"
            type="date"
            :max="hoy"
          >
          <small class="text-sm text-gray-600">
            [Se usa para la columna calculada de edad]: {{ calcularEdad(registro.nacimiento) }}
          </small>
        </div>

        <div class="grid gap-2">
          <label for="registro-enlace">[ENLACE WEB OPCIONAL]</label>
          <input
            id="registro-enlace"
            v-model.trim="registro.enlace"
            class="w-full rounded border border-[var(--color-borde)] p-2"
            type="url"
            placeholder="https://ejemplo.com"
          >
        </div>

        <!-- Select simple: las opciones salen de una lista del script (CATEGORIAS). -->
        <div class="grid gap-2">
          <label for="registro-categoria">[CATEGORIA]</label>
          <select
            id="registro-categoria"
            v-model="registro.categoria"
            class="w-full rounded border border-[var(--color-borde)] bg-white p-2"
            required
          >
            <option value="">
              [Selecciona una opcion]
            </option>
            <option
              v-for="categoria in CATEGORIAS"
              :key="categoria.valor"
              :value="categoria.valor"
            >
              {{ categoria.texto }}
            </option>
          </select>
        </div>

        <!--
          Select dependiente (patron provincia -> municipio del proyecto): al cambiar la
          categoria, el segundo selector se rellena con SUBCATEGORIAS[categoria].
        -->
        <div class="grid gap-2">
          <label for="registro-subcategoria">[SUBCATEGORIA DEPENDIENTE]</label>
          <select
            id="registro-subcategoria"
            v-model="registro.subcategoria"
            class="w-full rounded border border-[var(--color-borde)] bg-white p-2 disabled:bg-[#f1f3f4]"
            :disabled="subcategorias.length === 0"
          >
            <option value="">
              [Elige primero la categoria]
            </option>
            <option
              v-for="subcategoria in subcategorias"
              :key="subcategoria"
              :value="subcategoria"
            >
              {{ subcategoria }}
            </option>
          </select>
        </div>
      </div>

      <!-- Los ficheros no admiten v-model: lee el evento change en el script. -->
      <div class="grid gap-2">
        <label for="registro-archivo">[ARCHIVO OPCIONAL]</label>
        <input
          id="registro-archivo"
          class="w-full rounded border border-[var(--color-borde)] p-2"
          type="file"
          @change="seleccionarArchivo"
        >
        <span
          v-if="archivoSeleccionado"
          class="text-sm text-gray-600"
        >
          [Archivo elegido]: {{ archivoSeleccionado.name }}
        </span>
      </div>

      <!--
        Radio generado con v-for sobre ESTADOS: comparten v-model, asi que solo una
        opcion puede quedar seleccionada. El value de la opcion es el valor guardado.
      -->
      <fieldset class="grid gap-2">
        <legend>[ESTADO DEL REGISTRO]</legend>
        <label
          v-for="estado in ESTADOS"
          :key="estado.valor"
          class="flex items-center gap-2"
        >
          <input
            v-model="registro.estado"
            type="radio"
            :value="estado.valor"
          >
          {{ estado.texto }}
        </label>
      </fieldset>

      <!-- Checkbox enlazado a un booleano: util para consentimiento o una opcion si/no. -->
      <label class="flex items-center gap-2">
        <input
          v-model="registro.confirmado"
          type="checkbox"
        >
        [Confirmar o aceptar esta opcion]
      </label>

      <!-- Textarea para texto libre; maxlength limita caracteres en el navegador. -->
      <div class="grid gap-2">
        <label for="registro-descripcion">[DESCRIPCION OPCIONAL]</label>
        <textarea
          id="registro-descripcion"
          v-model.trim="registro.descripcion"
          class="w-full rounded border border-[var(--color-borde)] p-2"
          rows="3"
          maxlength="500"
          placeholder="[Escribe una descripcion]"
        />
      </div>

      <!-- Error reactivo: asigna el mensaje en el catch de las peticiones de tu API. -->
      <p
        v-if="error"
        class="rounded border border-red-300 bg-red-50 p-3 text-red-700"
        role="alert"
      >
        {{ error }}
      </p>

      <!--
        Un solo formulario sirve para alta y edicion. El boton se desactiva mientras
        guarda o mientras formularioValido es false (campos obligatorios sin cubrir).
      -->
      <div class="flex flex-wrap justify-center gap-3">
        <button
          class="rounded bg-[#1b4965] px-5 py-2 font-semibold text-white hover:bg-[#153c54] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          :disabled="guardando || !formularioValido"
        >
          [GUARDAR]
        </button>
        <button
          v-if="editando"
          class="rounded border border-[var(--color-borde)] px-5 py-2 hover:bg-gray-100"
          type="button"
          @click="limpiarFormulario"
        >
          [CANCELAR]
        </button>
        <button
          v-else
          class="rounded border border-[var(--color-borde)] px-5 py-2 hover:bg-gray-100"
          type="reset"
          @click="limpiarFormulario"
        >
          [LIMPIAR]
        </button>
      </div>
    </form>

    <!--
      BLOQUE 2: BARRA DE FILTROS
      Todo se filtra en el cliente con computed encadenados: buscar -> filtros ->
      orden -> pagina. Si el backend ya filtra, quita el computed correspondiente.
    -->
    <div class="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="grid gap-2">
        <label for="filtro-buscar">[BUSCAR EN LA LISTA]</label>
        <input
          id="filtro-buscar"
          v-model.trim="buscar"
          class="w-full rounded border border-[var(--color-borde)] p-2"
          type="search"
          placeholder="[Escribe un nombre o descripcion]"
        >
      </div>

      <div class="grid gap-2">
        <label for="filtro-estado">[FILTRAR POR ESTADO]</label>
        <select
          id="filtro-estado"
          v-model="filtroEstado"
          class="w-full rounded border border-[var(--color-borde)] bg-white p-2"
        >
          <option value="">
            [Todos los estados]
          </option>
          <option
            v-for="estado in ESTADOS"
            :key="estado.valor"
            :value="estado.valor"
          >
            {{ estado.texto }}
          </option>
        </select>
      </div>

      <div class="grid gap-2">
        <label for="filtro-categoria">[FILTRAR POR CATEGORIA]</label>
        <select
          id="filtro-categoria"
          v-model="filtroCategoria"
          class="w-full rounded border border-[var(--color-borde)] bg-white p-2"
        >
          <option value="">
            [Todas las categorias]
          </option>
          <option
            v-for="categoria in CATEGORIAS"
            :key="categoria.valor"
            :value="categoria.valor"
          >
            {{ categoria.texto }}
          </option>
        </select>
      </div>

      <!-- Rango de fechas: se comparan como texto AAAA-MM-DD, que ya ordena bien. -->
      <div class="grid gap-2">
        <label for="filtro-desde">[DESDE]</label>
        <input
          id="filtro-desde"
          v-model="desde"
          class="w-full rounded border border-[var(--color-borde)] p-2"
          type="date"
        >
      </div>

      <div class="grid gap-2">
        <label for="filtro-hasta">[HASTA]</label>
        <input
          id="filtro-hasta"
          v-model="hasta"
          class="w-full rounded border border-[var(--color-borde)] p-2"
          type="date"
        >
      </div>

      <div class="flex items-end gap-2">
        <button
          class="rounded border border-[var(--color-borde)] px-4 py-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="filtrosActivos.length === 0"
          @click="limpiarFiltros"
        >
          [LIMPIAR FILTROS]
        </button>
      </div>

      <p class="text-sm text-gray-600 sm:col-span-2 lg:col-span-4">
        [Mostrando] {{ listaOrdenada.length }} [de] {{ registros.length }} [registros]
      </p>
    </div>

    <!-- Chips de filtros activos: se generan desde filtrosActivos del script. -->
    <ul
      v-if="filtrosActivos.length"
      class="mb-4 flex list-none flex-wrap gap-2 p-0"
    >
      <li
        v-for="filtro in filtrosActivos"
        :key="filtro"
        class="rounded-full bg-[#eef2f5] px-3 py-1 text-sm text-[#1b4965]"
      >
        {{ filtro }}
      </li>
    </ul>

    <!--
      BLOQUE 3: FICHA DEL REGISTRO SELECCIONADO
      Usa <dl> para pares nombre/valor: es la forma accesible de mostrar una ficha.
      seleccionado se rellena con el boton de la tabla.
    -->
    <section
      v-if="seleccionado"
      class="mb-4 rounded border border-[var(--color-borde)] bg-[#f8f9fa] p-4"
      aria-labelledby="detalle-titulo"
    >
      <h5
        id="detalle-titulo"
        class="mb-3 font-semibold"
      >
        [DETALLE DEL REGISTRO SELECCIONADO]
      </h5>
      <dl class="grid gap-2 sm:grid-cols-2">
        <div>
          <dt class="text-xs font-semibold uppercase text-gray-600">
            [NOMBRE]
          </dt>
          <dd class="m-0">
            {{ seleccionado.nombre || POR_DEFECTO }}
          </dd>
        </div>
        <div>
          <dt class="text-xs font-semibold uppercase text-gray-600">
            [CONTACTO]
          </dt>
          <dd class="m-0">
            {{ seleccionado.correo || seleccionado.telefono || POR_DEFECTO }}
          </dd>
        </div>
        <div>
          <dt class="text-xs font-semibold uppercase text-gray-600">
            [FECHA]
          </dt>
          <dd class="m-0">
            {{ formatearFecha(seleccionado.fecha) || POR_DEFECTO }}
          </dd>
        </div>
        <div>
          <dt class="text-xs font-semibold uppercase text-gray-600">
            [EDAD CALCULADA]
          </dt>
          <dd class="m-0">
            {{ calcularEdad(seleccionado.nacimiento) }}
          </dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-xs font-semibold uppercase text-gray-600">
            [DESCRIPCION]
          </dt>
          <dd class="m-0">
            {{ seleccionado.descripcion || POR_DEFECTO }}
          </dd>
        </div>
      </dl>
      <button
        class="mt-3 rounded border border-[var(--color-borde)] px-3 py-1 text-sm hover:bg-white"
        type="button"
        @click="seleccionado = null"
      >
        [CERRAR FICHA]
      </button>
    </section>

    <!--
      BLOQUE 6: ESTADOS DE LA LISTA
      v-if / v-else-if / v-else son hermanos y exclusivos: solo se pinta uno.
      No metas comentarios entre las ramas o Vue puede no reconocer el v-else.
    -->
    <p
      v-if="cargando"
      class="py-4 text-center text-gray-600"
    >
      [CARGANDO REGISTROS...]
    </p>
    <p
      v-else-if="error"
      class="rounded border border-red-300 bg-red-50 p-3 text-red-700"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-else-if="listaOrdenada.length === 0"
      class="py-4 text-center text-gray-600"
    >
      [No hay registros que coincidan con los filtros.]
    </p>

    <!--
      BLOQUE 4: TABLA
      listaPagina es la lista despues de buscar, filtrar, ordenar y paginar.
      Cada cabecera ordenable es un boton: ademas de verse, se puede usar con teclado.
    -->
    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr class="bg-gray-100">
            <th
              scope="col"
              class="border border-[var(--color-borde)] p-3"
              :aria-sort="ariaSort('nombre')"
            >
              <button
                class="flex w-full items-center gap-1 font-semibold"
                type="button"
                @click="ordenarPorClave('nombre')"
              >
                [NOMBRE]
                <span aria-hidden="true">{{ indicadorOrden('nombre') }}</span>
              </button>
            </th>
            <th
              scope="col"
              class="border border-[var(--color-borde)] p-3"
            >
              [CONTACTO]
            </th>
            <th
              scope="col"
              class="border border-[var(--color-borde)] p-3"
            >
              [CATEGORIA / ESTADO]
            </th>
            <th
              scope="col"
              class="border border-[var(--color-borde)] p-3"
              :aria-sort="ariaSort('fecha')"
            >
              <button
                class="flex w-full items-center gap-1 font-semibold"
                type="button"
                @click="ordenarPorClave('fecha')"
              >
                [FECHA]
                <span aria-hidden="true">{{ indicadorOrden('fecha') }}</span>
              </button>
            </th>
            <th
              scope="col"
              class="border border-[var(--color-borde)] p-3"
            >
              [EDAD]
            </th>
            <th
              scope="col"
              class="border border-[var(--color-borde)] p-3"
            >
              [ACCIONES]
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- v-for recibe cada registro de la pagina; :key debe ser un id estable. -->
          <tr
            v-for="item in listaPagina"
            :key="item.id"
            class="hover:bg-gray-50"
            :class="{ 'bg-[#eef5f2]': seleccionado?.id === item.id }"
          >
            <td class="border border-[var(--color-borde)] p-3">
              {{ item.nombre }}
              <span
                v-if="item.confirmado"
                class="ml-2 text-sm text-green-700"
              >
                [Confirmado]
              </span>
            </td>

            <!-- Correo y telefono clicables: mailto y tel abren la app del sistema. -->
            <td class="border border-[var(--color-borde)] p-3">
              <a
                v-if="item.correo"
                class="block text-[#1b4965] underline"
                :href="`mailto:${item.correo}`"
              >
                {{ item.correo }}
              </a>
              <a
                v-if="item.telefono"
                class="block text-[#1b4965] underline"
                :href="`tel:${item.telefono}`"
              >
                {{ item.telefono }}
              </a>
              <span v-if="!item.correo && !item.telefono">[Sin contacto]</span>
            </td>

            <!-- Color por estado con clase calculada; el texto se mantiene para no
                 depender solo del color (accesibilidad). -->
            <td class="border border-[var(--color-borde)] p-3">
              {{ etiquetaCategoria(item.categoria) }}
              <span
                class="ml-2 inline-flex items-center rounded px-2 py-1 text-xs font-semibold"
                :class="claseEstado(item.estado)"
              >
                {{ etiquetaEstado(item.estado) }}
              </span>
            </td>

            <!-- Fecha guardada como AAAA-MM-DD; se muestra en dd/mm/aaaa. -->
            <td class="border border-[var(--color-borde)] p-3">
              {{ formatearFecha(item.fecha) || POR_DEFECTO }}
              <span v-if="item.hora"> · {{ item.hora }}</span>
            </td>

            <!-- Columna calculada: no esta en la API, sale de nacimiento. -->
            <td class="border border-[var(--color-borde)] p-3 text-center">
              {{ calcularEdad(item.nacimiento) }}
            </td>

            <td class="border border-[var(--color-borde)] p-3">
              <!-- Los botones pasan el item actual a sus funciones del script. -->
              <div class="flex flex-wrap gap-2">
                <button
                  class="rounded border border-[var(--color-borde)] px-3 py-1 hover:bg-gray-100"
                  type="button"
                  aria-label="[Seleccionar]"
                  :aria-pressed="seleccionado?.id === item.id"
                  @click="seleccionarRegistro(item)"
                >
                  {{ seleccionado?.id === item.id ? "[ELEGIDO]" : "[ELEGIR]" }}
                </button>
                <button
                  class="rounded border border-[var(--color-borde)] px-3 py-1 hover:bg-gray-100"
                  type="button"
                  aria-label="[EDITAR]"
                  @click="editarRegistro(item)"
                >
                  [EDITAR]
                </button>
                <button
                  class="rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50"
                  type="button"
                  aria-label="[ELIMINAR]"
                  @click="eliminarRegistro(item)"
                >
                  [ELIMINAR]
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!--
      BLOQUE 5: PAGINACION
      pagina es un indice base 1; se limita a [1, paginasTotales] para que no quede
      fuera de rango al filtrar.
    -->
    <div
      v-if="!cargando && listaOrdenada.length"
      class="mt-4 flex flex-wrap items-center justify-center gap-3"
    >
      <button
        class="rounded border border-[var(--color-borde)] px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="pagina === 1"
        @click="cambiarPagina(-1)"
      >
        [ANTERIOR]
      </button>
      <span class="text-sm text-gray-600">
        [Pagina] {{ pagina }} [de] {{ paginasTotales }}
      </span>
      <button
        class="rounded border border-[var(--color-borde)] px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="pagina === paginasTotales"
        @click="cambiarPagina(1)"
      >
        [SIGUIENTE]
      </button>
    </div>

    <!--
      BLOQUE 7: NOTAS REUTILIZABLES
      Tailwind en breve: grid / flex distribuyen; gap-* separa; p-* y m-* ajustan
      espacios; hover:* cambia al pasar el raton; sm: y lg: adaptan el diseno desde
      ese ancho; disabled:* estiliza los controles desactivados.
      Los formatos (fecha, edad, etiquetas de estado y categoria, colores) estan
      implementados abajo en el script para copiarlos a cualquier pantalla.
      Para estilos compartidos por toda la app, consulta src/style.css.
    -->
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue"
// Utilidades reales del proyecto: PDF, dialogos, texto y listas.
import { generarPDF } from "../utils/pdf.js"
import { alertaConfirmacion, alertaError, alertaExito } from "../utils/alertas.js"
import { capitalizar, normalizar } from "../utils/texto.js"
import { ordenarPor, paginar, totalPaginas } from "../utils/listas.js"

/*
 * ESTA ES LA BASE DE UN COMPONENTE CRUD EN EL PROYECTO.
 * Sigue este orden para cualquier pantalla nueva:
 *   1. define el modelo del formulario (registroVacio),
 *   2. prepara la lista base (registros),
 *   3. añade busqueda, filtros, orden y paginacion con computed encadenados,
 *   4. crea la logica de guardar/editar/eliminar,
 *   5. conecta la API cuando la entidad exista en backend.
 *
 * Cuanto mas claro y consistente sea el nombre de cada campo, menos errores
 * tendras al enlazarlo con v-model, con la API y con MongoDB.
 */

// Cambia este texto por el nombre de la pantalla; el template lo muestra con {{ titulo }}.
const titulo = ref("[GESTION DE [NOMBRE DE LA ENTIDAD]]")

// Opciones de los desplegables. valor es lo que se guarda; texto es lo que se ve.
const ESTADOS = [
  { valor: "activo", texto: "[Activo]" },
  { valor: "pendiente", texto: "[Pendiente]" },
  { valor: "cancelado", texto: "[Cancelado]" }
]

const CATEGORIAS = [
  { valor: "opcion-1", texto: "[Opcion 1]" },
  { valor: "opcion-2", texto: "[Opcion 2]" }
]

// Dependencia entre dos selectores, como provincia -> municipio en el proyecto.
// La clave es el valor de la categoria y el array son sus subcategorias.
const SUBCATEGORIAS = {
  "opcion-1": ["[Subcategoria 1.1]", "[Subcategoria 1.2]"],
  "opcion-2": ["[Subcategoria 2.1]"]
}

// Registros por pagina y texto que se muestra cuando un campo no tiene valor.
const TAMANO_PAGINA = 5
const POR_DEFECTO = "—"

// Fecha de hoy en formato AAAA-MM-DD para limitar los inputs de fecha: :min en la
// fecha del registro (no fechas pasadas) y :max en la de nacimiento (no futuras).
function fechaHoy() {
  const ahora = new Date()
  const mes = String(ahora.getMonth() + 1).padStart(2, "0")
  const dia = String(ahora.getDate()).padStart(2, "0")

  return `${ahora.getFullYear()}-${mes}-${dia}`
}

const hoy = fechaHoy()

// Plantilla de valores del formulario. Ajusta propiedades y tipos a tu modelo/API.
const registroVacio = () => ({
  id: "",
  nombre: "",
  dni: "",
  correo: "",
  telefono: "",
  fecha: "",
  hora: "",
  cantidad: null,
  nacimiento: "",
  enlace: "",
  categoria: "",
  subcategoria: "",
  estado: "activo",
  confirmado: false,
  descripcion: ""
})

// Estado del formulario enlazado a sus inputs mediante v-model.
const registro = reactive(registroVacio())

// Datos de demostracion: permiten probar filtros, orden, paginacion y la ficha sin
// arrancar el backend. Cuando conectes la API, deja el array vacio y llena la lista
// en cargarRegistros().
const registrosDemo = [
  {
    id: "ejemplo-1",
    nombre: "[Ejemplo] Ana Perez",
    correo: "ana@correo.test",
    telefono: "600123456",
    fecha: "2026-11-10",
    hora: "09:30",
    cantidad: 2,
    nacimiento: "1990-05-14",
    enlace: "",
    categoria: "opcion-1",
    subcategoria: "[Subcategoria 1.1]",
    estado: "activo",
    confirmado: true,
    descripcion: "[Puedes borrar estos datos de demostracion.]"
  },
  {
    id: "ejemplo-2",
    nombre: "[Ejemplo] Luis Gomez",
    correo: "",
    telefono: "611222333",
    fecha: "2026-11-19",
    hora: "12:00",
    cantidad: null,
    nacimiento: "2001-02-03",
    enlace: "",
    categoria: "opcion-2",
    subcategoria: "[Subcategoria 2.1]",
    estado: "pendiente",
    confirmado: false,
    descripcion: "[Otro registro de ejemplo con campos opcionales vacios.]"
  },
  {
    id: "ejemplo-3",
    nombre: "[Ejemplo] Marta Vidal",
    correo: "marta@correo.test",
    telefono: "",
    fecha: "2025-12-01",
    hora: "",
    cantidad: 5,
    nacimiento: "",
    enlace: "https://ejemplo.com",
    categoria: "opcion-1",
    subcategoria: "[Subcategoria 1.2]",
    estado: "cancelado",
    confirmado: false,
    descripcion: "[Registro antiguo para ver el filtro por rango de fechas.]"
  }
]

const registros = ref([...registrosDemo])

// Filtros y orden de la lista. Cada uno esta enlazado a un control del bloque 2.
const buscar = ref("")
const filtroEstado = ref("")
const filtroCategoria = ref("")
const desde = ref("")
const hasta = ref("")
const ordenClave = ref("nombre")
const ordenAscendente = ref(true)
const pagina = ref(1)

// Estados de interfaz para conectar a una carga asincrona y mostrar errores del backend.
const cargando = ref(false)
const guardando = ref(false)
const error = ref("")
const editando = ref(false)
// Un input file se lee mediante change; no se puede enlazar con v-model como texto.
const archivoSeleccionado = ref(null)
// El error de correo no se muestra hasta que el usuario toca el campo.
const mailTocado = ref(false)
// Registro elegido con el boton [ELEGIR]; alimenta la ficha del bloque 3.
const seleccionado = ref(null)

// Buscador: normalizar() quita tildes y mayusculas, asi "lopez" encuentra "Lopez".
const listaBuscada = computed(() => {
  const consulta = normalizar(buscar.value)

  if (!consulta) {
    return registros.value
  }

  return registros.value.filter((item) =>
    normalizar(`${item.nombre} ${item.descripcion} ${item.correo}`).includes(consulta)
  )
})

// Filtros opcionales encadenados: cada condicion empieza por "!filtro ||" para que un
// filtro vacio deje pasar todos los registros. Las fechas se comparan como texto.
const listaFiltrada = computed(() =>
  listaBuscada.value.filter(
    (item) =>
      (!filtroEstado.value || item.estado === filtroEstado.value) &&
      (!filtroCategoria.value || item.categoria === filtroCategoria.value) &&
      (!desde.value || item.fecha >= desde.value) &&
      (!hasta.value || item.fecha <= hasta.value)
  )
)

// Orden y pagina: cada paso lee el resultado del anterior, sin tocar el array original.
const listaOrdenada = computed(() =>
  ordenarPor(listaFiltrada.value, ordenClave.value, ordenAscendente.value)
)
const listaPagina = computed(() =>
  paginar(listaOrdenada.value, pagina.value, TAMANO_PAGINA)
)
const paginasTotales = computed(() => totalPaginas(listaOrdenada.value, TAMANO_PAGINA))

// Texto de los chips del bloque 2: se construye solo con los filtros activos.
const filtrosActivos = computed(() => {
  const activos = []

  if (buscar.value) {
    activos.push(`[Buscar]: ${buscar.value}`)
  }
  if (filtroEstado.value) {
    activos.push(`[Estado]: ${etiquetaEstado(filtroEstado.value)}`)
  }
  if (filtroCategoria.value) {
    activos.push(`[Categoria]: ${etiquetaCategoria(filtroCategoria.value)}`)
  }
  if (desde.value) {
    activos.push(`[Desde]: ${formatearFecha(desde.value)}`)
  }
  if (hasta.value) {
    activos.push(`[Hasta]: ${formatearFecha(hasta.value)}`)
  }

  return activos
})

// El boton de guardar solo se activa con los campos obligatorios cubiertos.
const formularioValido = computed(() =>
  Boolean(registro.nombre.trim() && registro.categoria && registro.estado)
)

// Validaciones de los campos opcionales. Solo se muestran al tocar el campo.
const mailInvalido = computed(
  () => mailTocado.value && registro.correo !== "" && !validarMail(registro.correo)
)
const telefonoInvalido = computed(
  () => registro.telefono !== "" && !/^[67]\d{8}$/.test(registro.telefono)
)
// El DNI se valida solo si el campo tiene contenido; si en tu entidad es obligatorio,
// añade tambien registro.dni a formularioValido.
const dniInvalido = computed(() => registro.dni !== "" && !validarDni(registro.dni))

// Segun la categoria elegida, el segundo selector muestra unas opciones u otras.
const subcategorias = computed(() => SUBCATEGORIAS[registro.categoria] ?? [])

// Cualquier cambio de filtro devuelve la lista a la primera pagina: si estabas en la
// pagina 3 y ahora solo quedan 2 resultados, esa pagina ya no existe.
watch([buscar, filtroEstado, filtroCategoria, desde, hasta], () => {
  pagina.value = 1
})

// Carga inicial: en el ejemplo solo copia los datos de demostracion.
onMounted(async () => {
  await cargarRegistros()
})

/*
 * PUNTO DE CONEXION CON LA API
 * Sustituye el cuerpo de estas funciones por las de src/api/:
 *   import { getRegistros, saveRegistro, modifyRegistro, deleteRegistro } from "../api/entidad.js"
 *   registros.value = await getRegistros()
 *   await saveRegistro({ ...registro })
 *   await modifyRegistro(registro.id, datos)
 *   await deleteRegistro(item.id)
 * Manten los nombres de campo iguales en backend, API y formulario.
 */

// Rellena la lista. En local solo simula la espera; con API hace la peticion real.
async function cargarRegistros() {
  cargando.value = true
  error.value = ""

  try {
    registros.value = [...registrosDemo]
  } catch (err) {
    error.value = mensajeError(err, "[No se pudieron cargar los registros.]")
  } finally {
    cargando.value = false
  }
}

// Crea o actualiza el elemento local; sustituye este bloque por save/modify de src/api/.
async function guardarRegistro() {
  if (!formularioValido.value) {
    await alertaError("[Completa los campos obligatorios antes de guardar.]")
    return
  }

  error.value = ""
  guardando.value = true

  try {
    // Copia el modelo para no almacenar el objeto reactive del formulario directamente.
    const datos = { ...registro }

    if (editando.value) {
      registros.value = registros.value.map((item) =>
        item.id === datos.id ? datos : item
      )
    } else {
      datos.id = crypto.randomUUID()
      registros.value.push(datos)
    }

    Object.assign(registro, datos)
    editando.value = true
    await alertaExito(
      editando.value
        ? "[Registro actualizado correctamente.]"
        : "[Registro guardado correctamente.]"
    )
  } catch (err) {
    // En el ejemplo local esto cubre errores sin ocultarlos; al usar API muestra su mensaje HTTP.
    error.value = mensajeError(err, "[No se pudo guardar el registro.]")
    await alertaError(error.value)
  } finally {
    guardando.value = false
  }
}

// Copia el registro seleccionado al formulario y activa el modo de actualizacion.
function editarRegistro(item) {
  // registroVacio limpia los campos que el item no traiga; item rellena el resto.
  Object.assign(registro, registroVacio(), item)
  archivoSeleccionado.value = null
  error.value = ""
  editando.value = true
}

// Elimina un registro despues de confirmar; conecta aqui delete de src/api/ para persistirlo.
async function eliminarRegistro(item) {
  const confirmacion = await alertaConfirmacion(
    `[Quieres eliminar el registro] "${item.nombre}"?`,
    "[Eliminar registro]"
  )

  if (!confirmacion.isConfirmed) {
    return
  }

  try {
    registros.value = registros.value.filter((fila) => fila.id !== item.id)

    if (registro.id === item.id) {
      limpiarFormulario()
    }
    if (seleccionado.value?.id === item.id) {
      seleccionado.value = null
    }

    await alertaExito("[Registro eliminado correctamente.]")
  } catch (err) {
    error.value = mensajeError(err, "[No se pudo eliminar el registro.]")
    await alertaError(error.value)
  }
}

// Reinicia campos, errores y modo de edicion sin reemplazar el proxy reactive.
function limpiarFormulario() {
  Object.assign(registro, registroVacio())
  archivoSeleccionado.value = null
  editando.value = false
  error.value = ""
}

// Guarda el primer fichero elegido; para enviarlo al backend usa FormData.
function seleccionarArchivo(event) {
  archivoSeleccionado.value = event.target.files?.[0] ?? null
}

/*
 * SELECCION COMPARTIDA
 * Aqui la seleccion vive en el componente. Si tiene que verse en otra pantalla,
 * sustituye este ref por el store de Pinia de la entidad:
 *   import { useEntidadStore } from "../store/entidadStore.js"
 *   const entidadStore = useEntidadStore()
 *   entidadStore.seleccionar(item)   // y en la otra pantalla: leer del store
 * El store se pierde al recargar la pagina; para conservarla, usa la ruta con
 * parametro (/entidad/:id) y lee el id con useRoute().params.id.
 */
function seleccionarRegistro(item) {
  seleccionado.value = seleccionado.value?.id === item.id ? null : item
}

// Ordena por la columna pulsada y alterna ascendente/descendente si se repite.
function ordenarPorClave(clave) {
  if (ordenClave.value === clave) {
    ordenAscendente.value = !ordenAscendente.value
    return
  }

  ordenClave.value = clave
  ordenAscendente.value = true
  pagina.value = 1
}

// Valor de aria-sort para la cabecera, de modo que el lector de pantalla anuncie el orden.
function ariaSort(clave) {
  if (ordenClave.value !== clave) {
    return "none"
  }

  return ordenAscendente.value ? "ascending" : "descending"
}

// Flecha que se muestra en la cabecera ordenable.
function indicadorOrden(clave) {
  if (ordenClave.value !== clave) {
    return "↕"
  }

  return ordenAscendente.value ? "↑" : "↓"
}

// Cambia de pagina sin salirse del rango disponible.
function cambiarPagina(delta) {
  const siguiente = pagina.value + delta

  if (siguiente < 1 || siguiente > paginasTotales.value) {
    return
  }

  pagina.value = siguiente
}

// Devuelve la lista a su estado inicial sin recargar los datos.
function limpiarFiltros() {
  buscar.value = ""
  filtroEstado.value = ""
  filtroCategoria.value = ""
  desde.value = ""
  hasta.value = ""
  pagina.value = 1
}

// Pone en mayuscula la primera letra de cada palabra del campo indicado.
function capitalizarCampo(campo) {
  registro[campo] = capitalizar(registro[campo])
}

// Quita espacios y todo lo que no sea digito del telefono mientras se escribe.
function sanitizarTelefono(event) {
  const limpio = String(event.target.value ?? "").replace(/\D/g, "").slice(0, 9)
  event.target.value = limpio
  registro.telefono = limpio
}

// Recorta espacios del correo y permite mostrar despues su mensaje de validacion.
function sanitizarMail() {
  registro.correo = registro.correo.trim()
  mailTocado.value = true
}

// Acepta el correo vacio porque es opcional; si se rellena, comprueba un formato basico.
function validarMail(mail) {
  const correo = String(mail ?? "").trim()
  return correo === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)
}

// Comprueba la letra de control de un DNI: 8 digitos y una letra de la tabla.
// Para admitir NIE habria que sustituir la letra inicial X/Y/Z por 0/1/2 antes del calculo.
function validarDni(dni) {
  const limpio = String(dni ?? "").trim().toUpperCase()

  if (!/^\d{8}[A-Z]$/.test(limpio)) {
    return false
  }

  const letras = "TRWAGMYFPDXBNJZSQVHLCKE"
  const numero = Number(limpio.slice(0, 8))

  return limpio.charAt(8) === letras[numero % 23]
}

// Exporta el listado con los filtros aplicados, igual que se ve en la tabla.
async function exportarPDF() {
  try {
    await generarPDF({
      titulo: "[LISTADO DE [NOMBRE DE LA ENTIDAD]]",
      descripcion: filtrosActivos.value.length
        ? filtrosActivos.value.join(" | ")
        : "[Sin filtros aplicados]",
      cabeceras: ["[NOMBRE]", "[CONTACTO]", "[CATEGORIA]", "[ESTADO]", "[FECHA]", "[EDAD]"],
      filas: listaOrdenada.value.map((item) => [
        item.nombre ?? "",
        item.correo || item.telefono || "",
        etiquetaCategoria(item.categoria),
        etiquetaEstado(item.estado),
        formatearFecha(item.fecha),
        calcularEdad(item.nacimiento)
      ]),
      nombreArchivo: "listado.pdf"
    })
  } catch (err) {
    await alertaError(mensajeError(err, "[No se pudo generar el PDF.]"))
  }
}

// Muestra AAAA-MM-DD como dd/mm/aaaa. Se trocea el texto en vez de usar new Date():
// al interpretar la cadena como UTC, en Espana se veria el dia anterior.
function formatearFecha(fecha) {
  const partes = String(fecha ?? "").split("-")

  if (partes.length !== 3) {
    return fecha ?? ""
  }

  const [anio, mes, dia] = partes
  return `${dia}/${mes}/${anio}`
}

// Anios cumplidos a partir de AAAA-MM-DD. Se comparan mes y dia en vez de restar
// milisegundos, para no fallar al cambiar de anio ni por la zona horaria.
function calcularEdad(nacimiento) {
  const partes = String(nacimiento ?? "").split("-")

  if (partes.length !== 3) {
    return POR_DEFECTO
  }

  const [anio, mes, dia] = partes.map(Number)
  const hoy = new Date()
  let edad = hoy.getFullYear() - anio
  const cumplePendiente =
    hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)

  if (cumplePendiente) {
    edad -= 1
  }

  return edad >= 0 ? edad : POR_DEFECTO
}

// Convierte el codigo interno del estado en el texto que se presenta en la tabla.
function etiquetaEstado(estado) {
  return ESTADOS.find((opcion) => opcion.valor === estado)?.texto ?? estado
}

// Convierte el valor guardado de la categoria en su texto visible.
function etiquetaCategoria(categoria) {
  return CATEGORIAS.find((opcion) => opcion.valor === categoria)?.texto ?? categoria
}

// Clases del distintivo de estado. El color acompana al texto, nunca lo sustituye.
function claseEstado(estado) {
  const clases = {
    activo: "bg-[#dcfce7] text-[#166534]",
    pendiente: "bg-[#fff4d6] text-[#8a6d00]",
    cancelado: "bg-[#fde2e1] text-[#991b1b]"
  }

  return clases[estado] ?? "bg-gray-100 text-gray-700"
}

// Extrae el mensaje del backend desde Axios o devuelve el texto alternativo.
function mensajeError(err, porDefecto) {
  return err.response?.data?.mensaje || err.response?.data?.message || porDefecto
}
</script>
