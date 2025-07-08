
// Función para manejar la navegación
function manejarNavegacion() {
    const enlaces = document.querySelectorAll("#sidebar a");
    const secciones = document.querySelectorAll(".dashboard-section");

    enlaces.forEach(enlace => {
        enlace.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = enlace.getAttribute("href").substring(1);

            if (targetId === "cerrar-sesion") {
                cerrarSesion();
                return;
            }

            enlaces.forEach(el => el.classList.remove("active"));
            enlace.classList.add("active");

            secciones.forEach(seccion => {
                if (seccion.id === targetId) {
                    seccion.classList.add("active");
                    // Cargar datos específicos de la sección
                    switch(targetId) {
                        case "citas":
                            mostrarCitas();
                            break;
                        case "historias":
                            mostrarHistoriasClinicas();
                            break;
                        case "cuentas":
                            mostrarCuentas();
                            break;
                        case "servicios":
                            mostrarServicios();
                            break;
                    }
                } else {
                    seccion.classList.remove("active");
                }
            });
        });
    });
}

// Función para manejar el menú hamburguesa
function manejarHamburgerMenu() {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const sidebar = document.getElementById('sidebar');

    hamburgerMenu.addEventListener('click', (e) => {
        e.preventDefault();
        sidebar.classList.toggle('active');
    });
}

// Función para manejar las notificaciones
function manejarNotificaciones() {
    const notificationBell = document.querySelector('.notification-bell');
    const notificationsPanel = document.getElementById('notifications-panel');

    notificationBell.addEventListener('click', (e) => {
        e.preventDefault();
        notificationsPanel.style.display = notificationsPanel.style.display === 'block' ? 'none' : 'block';
    });

    // Cerrar el panel de notificaciones al hacer clic fuera de él
    document.addEventListener('click', (e) => {
        if (!notificationsPanel.contains(e.target) && !notificationBell.contains(e.target)) {
            notificationsPanel.style.display = 'none';
        }
    });
}

// Funciones para mostrar datos en el DOM (simuladas)
function mostrarCitas() {
    const listaCitas = document.getElementById("lista-citas");
    listaCitas.innerHTML = `
       
    `;
}

function mostrarHistoriasClinicas() {
    const listaHistorias = document.getElementById("lista-historias");
    listaHistorias.innerHTML = `
        
    `;
}

function mostrarCuentas() {
    const listaCuentas = document.getElementById("lista-cuentas");
    listaCuentas.innerHTML = `
      
    `;
}

function mostrarServicios() {
    const listaServicios = document.getElementById("lista-servicios");
    listaServicios.innerHTML = `
       
    `;
}

// Funciones para manejar eventos (simuladas)
function mostrarDetallesCita(id) {
    alert(`Mostrando detalles de la cita con ID: ${id}`);
}

function verHistoriaClinica(id) {
    alert(`Mostrando historia clínica con ID: ${id}`);
}

function editarCuenta(id) {
    alert(`Editando cuenta con ID: ${id}`);
}

function editarServicio(id) {
    alert(`Editando servicio con ID: ${id}`);
}

// Función para cerrar sesión (simulada)
function cerrarSesion() {
    req.session.destroy();
    res.redirect('/login');
}

// Función para inicializar la aplicación
function inicializarApp() {    
    manejarNavegacion();
    manejarHamburgerMenu();
    manejarNotificaciones();
    // Mostrar la sección de calendario por defecto
    document.getElementById("calendario").classList.add("active");
}

// Ejecutar funciones al cargar la página
window.onload = inicializarApp;

const daysContainer = document.querySelector(".days"),
nextBtn = document.querySelector(".next-btn"),
prevBtn = document.querySelector(".prev-btn"),
month = document.querySelector(".month"),
todayBtn= document.querySelector(".today-btn");


const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Setiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];

const days = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

//get current date
const date = new Date();
//get current month
let currentMonth = date.getMonth();
//get current year
let currentYear = date.getFullYear();

//function to render days
function renderCalendar(){


    date.setDate(1);
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const lastDayIndex = lastDay.getDay();
    const lastDayDate = lastDay.getDate();
    const prevLastDay = new Date(currentYear, currentMonth, 0);
    const prevLastDayDate = prevLastDay.getDate();
    const nextDays = 7 - lastDayIndex - 1;

    month.innerHTML = `${months[currentMonth]} ${currentYear}`;
    let days = "";

    for(let x= firstDay.getDay(); x > 0; x--){
        days += `<div class="day prev">${prevLastDayDate -x + 1}</div>`
    }


    for (let i = 1; i<=lastDayDate; i++){
        if(
            i=== new Date().getDate() &&
            currentMonth == new Date().getMonth() &&
            currentYear == new Date().getFullYear()
        ){
            days += `<div class="day today">${i}</div>`
        }else{
            days += `<div class="day">${i}</div>`
        }
    }

    for (let j = 1; j<=nextDays; j++){
        days += `<div class="day next">${j}</div>`;
    }


    hideTodayBtn();
    daysContainer.innerHTML=days;



}

renderCalendar();

nextBtn.addEventListener("click", ()=>{
    currentMonth++;
    if(currentMonth > 11){
       currentMonth = 0;
       currentYear++;
    }
    renderCalendar();
})

prevBtn.addEventListener("click", ()=>{
    currentMonth--;
    if(currentMonth < 0){
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
});

todayBtn.addEventListener("click",() =>{
    currentMonth = date.getMonth();
    currentYear=date.getFullYear();

    renderCalendar();
})

function hideTodayBtn(){
    if(
        currentMonth === new Date ().getMonth()&&
        currentYear === new Date().getFullYear()
    ){
        todayBtn.style.display = "none";
    } else{
        todayBtn.style.display = "flex";
    }
}

//funciones para crud servicios
