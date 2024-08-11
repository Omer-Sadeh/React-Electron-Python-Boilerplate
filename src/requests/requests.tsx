window.electron.ipcRenderer.once('ipc-port', arg => arg);

export async function get(endpoint: string, callback: (data: any) => void, errorCallback: (err: any) => void) {
  req(endpoint)
    .then((response) => {
      if (!response.ok) throw new Error(response.statusText);
      return response.json();
    })
    .then((data) => callback(data))
    .catch((error) => errorCallback(error));
}

export async function post(endpoint: string, body: any, callback: (data: any) => void, errorCallback: (err: any) => void) {
  req(endpoint, body)
    .then((response) => {
      if (!response.ok) throw new Error(response.statusText);
      return response.json();
    })
    .then((data) => callback(data))
    .catch((error) => errorCallback(error));
}

async function req(endpoint: string, body?: any) {
  let port = await window.electron.ipcRenderer.requestAnswer('ipc-port');
  let request: any = {
    method: body ? 'POST' : 'GET',
    headers: {'Content-Type': 'application/json'}
  }
  if (body) request.body = JSON.stringify(body);
  return fetch(`http://localhost:${port}/${endpoint}`, request)
}
