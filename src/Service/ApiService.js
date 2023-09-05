const ApiService = {}

const OBTAIN_CBL_API_URL = `https://www.medellin.gov.co/site_consulta_pot/BuscarFichaMat.hyg`

ApiService.obtainCBL = async (matricula) => {
    const obtaintCBL = await fetch(`${OBTAIN_CBL_API_URL}?buscar=${matricula}`,{
        method:'GET'
    })
    console.log(obtaintCBL)
    if(!obtaintCBL.ok){
        let response = {
            code: '500',
            msg:"Hubo un error al traer la información"
        }
        return response
    }
    let data = await obtaintCBL.json()
    let response = {
        code:'200',
        msg: "sucess",
        data: data
    }
    return response
}


export default ApiService