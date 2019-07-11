import React, { Component } from "react";
import { connect } from "react-redux";
import { Map, Popup, CircleMarker, TileLayer, Marker} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "../assets/map.css";

import { Alert, Button, Text } from "evergreen-ui";
import { CaseReportsBeforeDayQuery } from "../Features/Map/CaseReportsBeforeDayQuery";
import { QueryCoordinator } from "@dolittle/queries";

var firefoxIcon = L.icon({
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_the_Red_Cross.svg/250px-Flag_of_the_Red_Cross.svg.png',
    iconSize: [10, 10], // size of the icon
    });


function CaseMarkers({casesLastWeekAndMonth}){
    console.log(casesLastWeekAndMonth);
    return casesLastWeekAndMonth.map(cases => {
        cases.vals = new Array(cases.numberOfPeople);
        cases.vals.fill(1);

        return cases.vals.map(function(val){     
            return <Marker
                position={[cases.location.longitude, cases.location.latitude]} icon={firefoxIcon}
            ></Marker>
        });
    });   
};

class MapWidget extends Component {
    constructor(props) {
        super(props);

        this.state = {
            casesLastWeekAndMonth: [],
            isLoading: true,
            isError: false
        };
    }

    componentDidMount() {
        this.fetchCaseReportsBeforeDay();
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps.range.from !== this.props.range.from ||
            prevProps.range.to !== this.props.range.to
        ) {
            this.fetchCaseReportsBeforeDay();
        }
    }

    fetchCaseReportsBeforeDay() {
        this.queryCoordinator = new QueryCoordinator();
        let caseReportsBeforeDayQuery = new CaseReportsBeforeDayQuery();

        this.queryCoordinator.execute(caseReportsBeforeDayQuery).then(queryResult => {
            console.log(queryResult);
            if(queryResult.success){
                this.setState({ 
                    casesLastWeekAndMonth: queryResult.items[0].casesPerHealthRisk["9cd3c7b5-6973-45c3-a8d3-58d9eb38824c"].caseReportsLast7Days,
                    isError: false,
                    isLoading: false 
                })

            }
        }).catch(_ => 
            this.setState({
                isLoading: false,
                isError: true
            })
        );

    }

    render() {
        const position = [48.8, 2.3];
        if (this.state.isError) {
            return (
                <div
                    className="analytics--loadingContainer"
                    style={{ height: "500px" }}
                >
                    <Alert
                        intent="danger"
                        title="We could not the reach the backend"
                    >
                        {`Url: ${this.url}`}
                    </Alert>
                    <Button
                        marginTop={"20px"}
                        iconBefore="repeat"
                        onClick={() => this.fetchData()}
                    >
                        Retry
                    </Button>
                </div>
            );
        } else if(this.state.isLoading) {
            return (<div>Loading...</div>);
        }
        console.log(this.state.casesLastWeekAndMonth);
        return (
            <Map className="markercluster" center={[1.0, 1.0]} zoom={1} maxZoom={10}>
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
                />
                <MarkerClusterGroup>
                    <CaseMarkers casesLastWeekAndMonth={this.state.casesLastWeekAndMonth}></CaseMarkers>
                </MarkerClusterGroup>
             </Map>

        );
    }
}

function mapStateToProps(state) {
    return {
        range: state.analytics.range
    };
}

export default connect(mapStateToProps)(MapWidget);
