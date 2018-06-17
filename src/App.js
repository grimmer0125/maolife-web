import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import { Dropdown } from 'semantic-ui-react';

import './App.css';

/**
 * calculateStats, chart.js are copied from
 * https://github.com/grimmer0125/maolife/blob/develop/app/RecordChart.js
 */
import RecordChart from './chart';

const BASELINE_NUM = 15;
const MODE_REST = 0;
const MODE_SLEEP = 1;

const Constant = {
  MODE_REST,
  MODE_SLEEP,
};

const dropZoneStyle = {
  borderWidth: 2,
  borderColor: '#666',
  borderStyle: 'dashed',
  borderRadius: 5,
  // margin: 30,
  // padding: 30,
  width: 600,
  height: 150,
  textAlign: 'center',
  // transition: 'all 0.5s',
};

class App extends Component {
  constructor() {
    super();
    this.state = {
      files: [],
      selectedFileName: null,
      selectedPetID: null,
    };
  }

  onDrop= (acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const fileContent = JSON.parse(reader.result);
          console.log('file content,', fileContent);

          let ifMatch = false;
          for (const fileObj of this.state.files) {
            if (fileObj.name === file.name) {
              ifMatch = true;
              break;
            }
          }
          if (ifMatch === false) {
            const newFiles = [...this.state.files, { name: file.name, data: fileContent }];
            this.setState({ files: newFiles });
            this.handleSwitchFile(null, { value: file.name });
          }
        } catch (e) {
          console.log('parse json error:', e);
        }
      };
      reader.onabort = () => console.log('file reading was aborted');
      // e.g. "drag a folder" will fail to read
      reader.onerror = () => console.log('file reading has failed');
      reader.readAsText(file);
    });
  }

  handleSwitchFile = (e, obj) => {
    const { value } = obj;

    console.log('switch file:', value);

    this.setState({ selectedFileName: value });
  }

  handleSwitchPet = (e, obj) => {
    const { value } = obj;

    console.log('switch pet, petID:', value);

    this.setState({ selectedPetID: value });
  }

  calRegion(modeList, numOfBaseline) {
    const count = modeList.length;
    let headAvg = 0;
    let tailAvg = 0;
    if (count > numOfBaseline) {
      let total = 0;
      for (let i = 0; i < numOfBaseline; i += 1) {
        total += modeList[i].y;
      }
      headAvg = (total / numOfBaseline).toFixed(1);

      total = 0;
      for (let i = 0; i < numOfBaseline; i += 1) {
        total += modeList[count - 1 - i].y;
      }
      tailAvg = (total / numOfBaseline).toFixed(1);
    }

    return { headAvg, tailAvg };
  }

  calculateStats(breathRecord) {
    const recordTimeList = Object.keys(breathRecord);

    const stats = {
      rest: {
        data: [],
        total: 0,
        avg: 0,
        headAvg: 0,
        tailAvg: 0,
      },
      sleep: {
        data: [],
        total: 0,
        avg: 0,
        headAvg: 0,
        tailAvg: 0,
      },
      mixAvg: 0,
    };

    if (breathRecord) {
      for (const key of recordTimeList) {
        const record = breathRecord[key];
        let target = null;
        if (record.mode === Constant.MODE_REST) {
          target = stats.rest;
        } else if (record.mode === Constant.MODE_SLEEP) {
          target = stats.sleep;
        }

        target.data.push({
          x: new Date(key * 1000),
          y: record.breathRate,
        });
        target.total += record.breathRate;
      }
    }

    const countAll = stats.rest.data.length + stats.sleep.data.length;
    stats.rest.avg = stats.rest.data.length ? (stats.rest.total / stats.rest.data.length) : 0;
    stats.sleep.avg = stats.sleep.data.length ? (stats.sleep.total / stats.sleep.data.length) : 0;
    stats.mixAvg = countAll ? (stats.rest.total + stats.sleep.total) / countAll : 0;

    stats.rest = { ...stats.rest, ...this.calRegion(stats.rest.data, BASELINE_NUM) };
    stats.sleep = { ...stats.sleep, ...this.calRegion(stats.sleep.data, BASELINE_NUM) };
    return stats;
  }

  render() {
    console.log('in render state:', this.state);
    let fileOptions = null;
    let stats = null;
    const petOptions = [];
    let selectedFileObj = null;

    const { selectedFileName } = this.state;
    if (this.state.files.length > 0) {
      fileOptions = this.state.files.map(file => ({ text: file.name, value: file.name }));

      for (const fileObj of this.state.files) {
        if (selectedFileName === fileObj.name) {
          selectedFileObj = fileObj;
        }
      }
    }

    console.log('fileobj:', selectedFileObj);

    // NOTE: : people may have pets which have the same name but different petID
    if (selectedFileObj) {
      const { data } = selectedFileObj;
      Object.keys(data).forEach((petID) => {
        if (data[petID].name) {
          petOptions.push({
            text: data[petID].name,
            value: petID,
          });
        }
      });

      if (this.state.selectedPetID) {
        const pet = data[this.state.selectedPetID];
        if (pet && pet.breathRecord) {
          stats = this.calculateStats(pet.breathRecord);
        }
      }
    }
    const firstText = 'first';
    const lastText = 'last';
    const avgText = 'AVG';
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div>
          <Dropzone style={dropZoneStyle} onDrop={this.onDrop}>
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            >
              <div>
                <p>Try dropping pet data files here, <br />or click to select files to upload.</p>
              </div>
            </div>
          </Dropzone>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div>
            <Dropdown
              placeholder="Switch Files"
              selection
              onChange={this.handleSwitchFile}
              options={fileOptions}
              value={selectedFileName}
            />
          </div>
          <div>
            <Dropdown
              placeholder="Switch Pets"
              selection
              onChange={this.handleSwitchPet}
              options={petOptions}
            />
          </div>
        </div>
        <div>
          <div style={{ color: '#FF6347' }}>{stats ? `Rest CNT:${stats.rest.data.length}, ${firstText}${BASELINE_NUM}${avgText}:${stats.rest.headAvg}, ${lastText}${BASELINE_NUM}${avgText}:${stats.rest.tailAvg}` : ''}</div>

          <div style={{ color: 'blue' }}>{stats ? `Sleep CNT:${stats.sleep.data.length}, ${firstText}${BASELINE_NUM}${avgText}:${stats.sleep.headAvg}, ${lastText}${BASELINE_NUM}${avgText}:${stats.sleep.tailAvg}` : ''}</div>
        </div>

        <div style={{ width: 760 }}>
          {stats ? <RecordChart stats={stats} /> : null}
        </div>
      </div>
    );
  }
}

export default App;
