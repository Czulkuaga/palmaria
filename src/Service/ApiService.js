const ApiService = {}

// const SERVER = `http://localhost:4000`
const SERVER = `https://palmaria-bkn.conextec.com.co`

ApiService.obtainCBL = async (OBTAIN_CBL_API_URL, matricula) => {
    let formData ={
        url:OBTAIN_CBL_API_URL,
        params:matricula
    }

    const obtaintCBL = await fetch(`${SERVER}/api/cbml/get`,{
        method:"POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    })

    // console.log(obtaintCBL)

    if(!obtaintCBL.ok){
        let response = {
            code: '500',
            msg:"Hubo un error al traer la información"
        }
        return response
    }
    let data = await obtaintCBL.json()
    let response = {
        code:data.code,
        msg: data.msg,
        data: data.data
    }

    // console.log(response)

    return response
}

ApiService.obtainPOT48Data = async (cbml) => {
    const OBTAIN_POT48_DATA_API_URL = `https://www.medellin.gov.co/mapas/rest/services/ServiciosPlaneacion/POT48_Base/MapServer/1/query?where=cbml=${cbml}&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=102100&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=OBJECTID,CBML&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&f=pjson`
    const obtaintCBL = await fetch(`${OBTAIN_POT48_DATA_API_URL}`)
    // console.log(obtaintCBL)
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
        msg: "success",
        data: data
    }
    return response
}

ApiService.obtainValueM2 = async (xmin,ymin,xmax,ymax,spartialReference) => {
    const spartian = `{"wkid":${spartialReference.wkid},"latestWkid":${spartialReference.latestWkid}}`
    const OBTAIN_M2_VALUE_DATA_API_URL = `https://www.medellin.gov.co/servidormapas/rest/services/vivienda_ciudad_terri/VC_Catastro_VCT/MapServer/1/query?f=JSON&where=1=1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${xmin},"ymin":${ymin},"xmax":${xmax},"ymax":${ymax},"spatialReference":${spartian}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100`
    const obtaintM2Value = await fetch(`${OBTAIN_M2_VALUE_DATA_API_URL}`)
    // console.log(obtaintCBL)
    if(!obtaintM2Value.ok){
        let response = {
            code: '500',
            msg:"Hubo un error al traer la información"
        }
        return response
    }
    let data = await obtaintM2Value.json()
    let response = {
        code:'200',
        msg: "success",
        data: data
    }
    return response
}


export default ApiService