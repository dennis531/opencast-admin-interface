import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import cn from "classnames";
import { connect } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import TableFilters from "../shared/TableFilters";
import MainNav from "../shared/MainNav";
import Stats from "../shared/Stats";
import Table from "../shared/Table";
import Notifications from "../shared/Notifications";
import NewResourceModal from "../shared/NewResourceModal";
import DeleteEventsModal from "./partials/modals/DeleteEventsModal";
import StartTaskModal from "./partials/modals/StartTaskModal";
import EditScheduledEventsModal from "./partials/modals/EditScheduledEventsModal";
import EditMetadataEventsModal from "./partials/modals/EditMetadataEventsModal";
import { eventsTemplateMap } from "../../configs/tableConfigs/eventsTableMap";
import {
	loadEventsIntoTable,
	loadSeriesIntoTable,
} from "../../thunks/tableThunks";
import { fetchFilters, fetchStats, editTextFilter } from "../../slices/tableFilterSlice";
import {
	getTotalEvents,
	isFetchingAssetUploadOptions as getIsFetchingAssetUploadOptions,
	isShowActions,
} from "../../selectors/eventSelectors";
import { setOffset } from "../../actions/tableActions";
import { styleNavClosed, styleNavOpen } from "../../utils/componentsUtils";
import Header from "../Header";
import Footer from "../Footer";
import { getUserInformation } from "../../selectors/userInfoSelectors";
import { hasAccess } from "../../utils/utils";
import { useHotkeys } from "react-hotkeys-hook";
import { availableHotkeys } from "../../configs/hotkeysConfig";
import { getCurrentFilterResource } from "../../selectors/tableFilterSelectors";
import { fetchAssetUploadOptions } from "../../thunks/assetsThunks";
import { useAppDispatch, useAppSelector } from "../../store";
import {
	fetchEventMetadata,
	fetchEvents,
	setShowActions,
} from "../../slices/eventSlice";
import { fetchSeries } from "../../slices/seriesSlice";

// References for detecting a click outside of the container of the dropdown menu
const containerAction = React.createRef<HTMLDivElement>();

/**
 * This component renders the table view of events
 */
const Events = ({
// @ts-expect-error TS(7031): Binding element 'loadingEventsIntoTable' implicitl... Remove this comment to see the full error message
	loadingEventsIntoTable,
// @ts-expect-error TS(7031): Binding element 'loadingSeriesIntoTable' implicitl... Remove this comment to see the full error message
	loadingSeriesIntoTable,
// @ts-expect-error TS(7031): Binding element 'resetOffset' implicitly has an 'a... Remove this comment to see the full error message
	resetOffset,
}) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const currentFilterType = useAppSelector(state => getCurrentFilterResource(state));

	const [displayActionMenu, setActionMenu] = useState(false);
	const [displayNavigation, setNavigation] = useState(false);
	const [displayNewEventModal, setNewEventModal] = useState(false);
	const [displayDeleteModal, setDeleteModal] = useState(false);
	const [displayStartTaskModal, setStartTaskModal] = useState(false);
	const [
		displayEditScheduledEventsModal,
		setEditScheduledEventsModal,
	] = useState(false);
	const [displayEditMetadataEventsModal, setEditMetadataEventsModal] = useState(
		false
	);

	const user = useAppSelector(state => getUserInformation(state));
	const showActions = useAppSelector(state => isShowActions(state));
	const events = useAppSelector(state => getTotalEvents(state));
	const isFetchingAssetUploadOptions = useAppSelector(state => getIsFetchingAssetUploadOptions(state));

	let location = useLocation();

	// TODO: Get rid of the wrappers when modernizing redux is done
	const fetchEventsWrapper = () => {
		dispatch(fetchEvents())
	}

	const loadEvents = async () => {
		// Fetching stats from server
		dispatch(fetchStats());

		// Fetching events from server
		await dispatch(fetchEvents());

		// Load events into table
		loadingEventsIntoTable();
	};

	const loadSeries = () => {
		// Reset the current page to first page
		resetOffset();

		//fetching series from server
		dispatch(fetchSeries());

		//load series into table
		loadingSeriesIntoTable();
	};

	useEffect(() => {
		if ("events" !== currentFilterType) {
			dispatch(fetchFilters("events"))
		}

		// Reset text filter
		dispatch(editTextFilter(""));

		// disable actions button
		dispatch(setShowActions(false));

		// Load events on mount
		loadEvents().then((r) => console.info(r));

		// Function for handling clicks outside of an open dropdown menu
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerAction.current &&
				!containerAction.current.contains(e.target as Node)
			) {
				setActionMenu(false);
			}
		};

		// Fetch events every minute
		let fetchEventsInterval = setInterval(loadEvents, 5000);

		// Event listener for handle a click outside of dropdown menu
		window.addEventListener("mousedown", handleClickOutside);

		return () => {
			window.removeEventListener("mousedown", handleClickOutside);
			clearInterval(fetchEventsInterval);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.hash]);

	const toggleNavigation = () => {
		setNavigation(!displayNavigation);
	};

	const handleActionMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		setActionMenu(!displayActionMenu);
	};

	const showNewEventModal = async () => {
		await dispatch(fetchEventMetadata());
		await dispatch(fetchAssetUploadOptions());

		setNewEventModal(true);
	};

	const hideNewEventModal = () => {
		setNewEventModal(false);
	};

	const hideDeleteModal = () => {
		setDeleteModal(false);
	};

	const hideStartTaskModal = () => {
		setStartTaskModal(false);
	};

	const hideEditScheduledEventsModal = () => {
		setEditScheduledEventsModal(false);
	};

	const hideEditMetadataEventsModal = () => {
		setEditMetadataEventsModal(false);
	};

	useHotkeys(
    availableHotkeys.general.NEW_EVENT.sequence,
    () => showNewEventModal(),
		{
			description: t(availableHotkeys.general.NEW_EVENT.description) ?? undefined
		},
    [showNewEventModal]
  );

	return (
		<>
			<Header />
			<section className="action-nav-bar">
				<div className="btn-group">
					{hasAccess("ROLE_UI_EVENTS_CREATE", user) && (
						<button className="add" onClick={() => showNewEventModal()}>
							<i className="fa fa-plus" />
							<span>{t("EVENTS.EVENTS.ADD_EVENT")}</span>
						</button>
					)}
				</div>

				{
					/* Display modal for new event if add event button is clicked */
					!isFetchingAssetUploadOptions && (
						<NewResourceModal
							showModal={displayNewEventModal}
							handleClose={hideNewEventModal}
							resource={"events"}
						/>
					)
				}

				{/* Display bulk actions modal if one is chosen from dropdown */}
				{displayDeleteModal && <DeleteEventsModal close={hideDeleteModal} />}

				{displayStartTaskModal && <StartTaskModal close={hideStartTaskModal} />}

				{displayEditScheduledEventsModal && (
					<EditScheduledEventsModal close={hideEditScheduledEventsModal} />
				)}

				{displayEditMetadataEventsModal && (
					<EditMetadataEventsModal close={hideEditMetadataEventsModal} />
				)}

				{/* Include Burger-button menu */}
				<MainNav isOpen={displayNavigation} toggleMenu={toggleNavigation} />

				<nav>
					{hasAccess("ROLE_UI_EVENTS_VIEW", user) && (
						<Link
							to="/events/events"
							className={cn({ active: true })}
							onClick={() => loadEvents()}
						>
							{t("EVENTS.EVENTS.NAVIGATION.EVENTS")}
						</Link>
					)}
					{hasAccess("ROLE_UI_SERIES_VIEW", user) && (
						<Link
							to="/events/series"
							className={cn({ active: false })}
							onClick={() => loadSeries()}
						>
							{t("EVENTS.EVENTS.NAVIGATION.SERIES")}
						</Link>
					)}
				</nav>

				{/* Include status bar component*/}
				{hasAccess("ROLE_UI_EVENTS_COUNTERS_VIEW", user) && (
					<div className="stats-container">
						<Stats />
					</div>
				)}
			</section>

			<div
				className="main-view"
				style={displayNavigation ? styleNavOpen : styleNavClosed}
			>
				{/* Include notifications component */}
				<Notifications />

				<div className="controls-container">
					<div className="filters-container">
						<div
							className={cn("drop-down-container", { disabled: !showActions })}
							onClick={(e) => handleActionMenu(e)}
							ref={containerAction}
						>
							<span>{t("BULK_ACTIONS.CAPTION")}</span>
							{/* show dropdown if actions is clicked*/}
							{displayActionMenu && (
								<ul className="dropdown-ul">
									{hasAccess("ROLE_UI_EVENTS_DELETE", user) && (
										<li>
											<button className="button-like-anchor" onClick={() => setDeleteModal(true)}>
												{t("BULK_ACTIONS.DELETE.EVENTS.CAPTION")}
											</button>
										</li>
									)}
									{hasAccess("ROLE_UI_TASKS_CREATE", user) && (
										<li>
											<button className="button-like-anchor" onClick={() => setStartTaskModal(true)}>
												{t("BULK_ACTIONS.SCHEDULE_TASK.CAPTION")}
											</button>
										</li>
									)}
									{hasAccess("ROLE_UI_EVENTS_DETAILS_SCHEDULING_EDIT", user) &&
										hasAccess("ROLE_UI_EVENTS_DETAILS_METADATA_EDIT", user) && (
											<li>
												<button className="button-like-anchor" onClick={() => setEditScheduledEventsModal(true)}>
													{t("BULK_ACTIONS.EDIT_EVENTS.CAPTION")}
												</button>
											</li>
										)}
									{hasAccess("ROLE_UI_EVENTS_DETAILS_METADATA_EDIT", user) && (
										<li>
											<button className="button-like-anchor" onClick={() => setEditMetadataEventsModal(true)}>
												{t("BULK_ACTIONS.EDIT_EVENTS_METADATA.CAPTION")}
											</button>
										</li>
									)}
								</ul>
							)}
						</div>

						{/* Include filters component*/}
						<TableFilters
							loadResource={fetchEventsWrapper}
							loadResourceIntoTable={loadingEventsIntoTable}
							resource={"events"}
						/>
					</div>
					<h1>{t("EVENTS.EVENTS.TABLE.CAPTION")}</h1>
					<h4>{t("TABLE_SUMMARY", { numberOfRows: events })}</h4>
				</div>
				{/*Include table component*/}
				{/* <Table templateMap={eventsTemplateMap} resourceType="events" /> */}
        <Table templateMap={eventsTemplateMap} />
			</div>
			<Footer />
		</>
	);
};

// Getting state data out of redux store
// @ts-expect-error TS(7006): Parameter 'state' implicitly has an 'any' type.
const mapStateToProps = (state) => ({
});

// Mapping actions to dispatch
// @ts-expect-error TS(7006): Parameter 'dispatch' implicitly has an 'any' type.
const mapDispatchToProps = (dispatch) => ({
	loadingEventsIntoTable: () => dispatch(loadEventsIntoTable()),
	loadingSeriesIntoTable: () => dispatch(loadSeriesIntoTable()),
	resetOffset: () => dispatch(setOffset(0)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Events);
